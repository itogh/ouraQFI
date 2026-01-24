package com.example.focusdnd

import android.app.NotificationManager
import android.content.Context
import android.content.BroadcastReceiver
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import android.content.Context
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlin.system.measureTimeMillis

private const val TAG = "FocusDnd"

class FocusDndController(
    private val context: Context,
    private val notificationManager: NotificationManager,
    private val settingsRepository: SettingsRepository,
    private val scope: CoroutineScope,
) {

    private val mutex = Mutex()
    private var onTimerJob: Job? = null
    private var offTimerJob: Job? = null
    private var lastKnownFocused: Boolean? = null
    private var dndReceiver: BroadcastReceiver? = null

    // 呼び出し元が集中状態を通知する
    fun onFocusStateChanged(isFocused: Boolean, timestamp: Long = System.currentTimeMillis()) {
        scope.launch {
            mutex.withLock {
                Log.d(TAG, "onFocusStateChanged: isFocused=$isFocused timestamp=$timestamp")
                lastKnownFocused = isFocused
                val enabled = settingsRepository.getFocusDndEnabled()
                if (!enabled) {
                    Log.d(TAG, "DND feature disabled by settings; cancelling timers and returning")
                    cancelTimers()
                    return@launch
                }

                if (isFocused) {
                    // 集中開始 → minimumOnDuration 後に DND ON
                    offTimerJob?.cancel()
                    val minutes = settingsRepository.getFocusDndMinOnMinutes()
                    val delayMs = (minutes.coerceIn(0, 30) * 60_000L)
                    Log.d(TAG, "Starting ON-timer for $delayMs ms (minOnMinutes=$minutes)")
                    onTimerJob = scope.launch {
                        if (delayMs > 0) {
                            delay(delayMs)
                        }
                        applyDndOnIfAllowed()
                    }
                } else {
                    // 非集中 → offGraceSeconds 後に DND OFF
                    onTimerJob?.cancel()
                    val grace = settingsRepository.getFocusDndOffGraceSeconds()
                    val delayMs = (grace.coerceIn(0, 300) * 1000L)
                    Log.d(TAG, "Starting OFF-timer for $delayMs ms (offGraceSeconds=$grace)")
                    offTimerJob = scope.launch {
                        delay(delayMs)
                        applyDndOffIfNeeded()
                    }
                }
            }
        }
    }

    private suspend fun applyDndOnIfAllowed() {
        mutex.withLock {
            Log.d(TAG, "applyDndOnIfAllowed: checking permission and current state")
            if (!settingsRepository.focusDndEnabledFlow.value) {
                Log.d(TAG, "Skipping applyDndOn: feature disabled in settings")
                return
            }
            if (!DndUtils.isNotificationPolicyAccessGranted(context)) {
                Log.d(TAG, "Permission not granted: skipping DND apply (UI should show guidance)")
                return
            }
            val mode = settingsRepository.focusDndModeFlow.value
            val targetFilter = when (mode) {
                SettingsRepository.Mode.PRIORITY -> NotificationManager.INTERRUPTION_FILTER_PRIORITY
                SettingsRepository.Mode.NONE -> NotificationManager.INTERRUPTION_FILTER_NONE
            }
            val current = notificationManager.currentInterruptionFilter
            Log.d(TAG, "Current interruptionFilter=$current target=$targetFilter")

            // if already applied by app, do nothing
            if (settingsRepository.getFocusDndAppliedByApp()) {
                Log.d(TAG, "Already applied by app; skipping setInterruptionFilter")
                return
            }

            // 保存されていない previousFilter を保存
            if (settingsRepository.getFocusDndPrevFilter() == null) {
                settingsRepository.setPrevFilter(current)
                Log.d(TAG, "Saved previous filter=$current")
            }

            // Apply
            Log.d(TAG, "Setting interruptionFilter -> $targetFilter")
            notificationManager.setInterruptionFilter(targetFilter)
            // Record that app set interruption filter now
            settingsRepository.setLastAppSetAtMs(System.currentTimeMillis())
            settingsRepository.setAppliedByApp(true)
            Log.d(TAG, "DND applied by app; recorded flag")
        }
    }

    private suspend fun applyDndOffIfNeeded() {
        mutex.withLock {
            Log.d(TAG, "applyDndOffIfNeeded: checking recorded state to decide restore")
            if (!settingsRepository.getFocusDndAppliedByApp()) {
                Log.d(TAG, "App did not apply DND (flag not set); skipping restore")
                // If app didn't apply DND, we should not change the user's current setting.
                return
            }

            val prev = settingsRepository.getFocusDndPrevFilter()
            if (prev != null) {
                Log.d(TAG, "Restoring interruptionFilter -> $prev")
                notificationManager.setInterruptionFilter(prev)
                settingsRepository.setLastAppSetAtMs(System.currentTimeMillis())
            } else {
                // Fallback: set to INTERRUPTION_FILTER_ALL
                Log.d(TAG, "No previous filter stored; falling back to ALL")
                notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
                settingsRepository.setLastAppSetAtMs(System.currentTimeMillis())
            }
            settingsRepository.setAppliedByApp(false)
            settingsRepository.clearPrevFilter()
            Log.d(TAG, "Cleared applied flag and prevFilter")
        }
    }

    fun refreshPermissionState() {
        // noop here; caller can use DndUtils to check permission and SettingsScreen will show guidance
        Log.d(TAG, "refreshPermissionState called")
    }

    fun getPermissionStateFlow() = DndUtils.isNotificationPolicyAccessGrantedFlow(context)

    /**
     * Start observing external changes to the interruption filter.
     * When a change is detected and it is not within the "self change" window, mark applied_by_app=false
     * and update prev_filter to the current value.
     */
    fun startObserveDndChanges(ignoreWindowMs: Long = 1500L) {
        if (dndReceiver != null) return

        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                if (intent.action != NotificationManager.ACTION_INTERRUPTION_FILTER_CHANGED) return

                scope.launch {
                    val now = System.currentTimeMillis()
                    val last = settingsRepository.getLastAppSetAtMs()
                    val delta = now - last
                    if (delta in 0..ignoreWindowMs) {
                        Log.d(TAG, "Ignoring interruption filter change from self. delta=${delta}ms")
                        return@launch
                    }

                    // Considered external / user change
                    settingsRepository.setAppliedByApp(false)
                    val current = notificationManager.currentInterruptionFilter
                    settingsRepository.setPrevFilter(current)
                    Log.d(TAG, "External DND change detected. delta=${delta}ms current=$current -> applied_by_app=false")
                }
            }
        }

        val filter = IntentFilter(NotificationManager.ACTION_INTERRUPTION_FILTER_CHANGED)
        context.registerReceiver(receiver, filter)
        dndReceiver = receiver
        Log.d(TAG, "Started observing interruption filter changes")
    }

    fun stopObserveDndChanges() {
        dndReceiver?.let {
            try {
                context.unregisterReceiver(it)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to unregister receiver: ${e.message}")
            }
        }
        dndReceiver = null
        Log.d(TAG, "Stopped observing interruption filter changes")
    }

    private fun cancelTimers() {
        onTimerJob?.cancel()
        onTimerJob = null
        offTimerJob?.cancel()
        offTimerJob = null
    }

    fun openDndPermissionSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
