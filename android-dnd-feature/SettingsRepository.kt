package com.example.focusdnd

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import java.io.IOException

class SettingsRepository(private val dataStore: DataStore<Preferences>) {

    enum class Mode { PRIORITY, NONE }

    private object Keys {
        val FOCUS_DND_ENABLED = booleanPreferencesKey("focus_dnd_enabled")
        val FOCUS_DND_MODE = stringPreferencesKey("focus_dnd_mode")
        val FOCUS_DND_MIN_ON_MINUTES = intPreferencesKey("focus_dnd_min_on_minutes")
        val FOCUS_DND_OFF_GRACE_SECONDS = intPreferencesKey("focus_dnd_off_grace_seconds")
        val FOCUS_DND_PREV_FILTER = intPreferencesKey("focus_dnd_prev_filter")
        val FOCUS_DND_APPLIED_BY_APP = booleanPreferencesKey("focus_dnd_applied_by_app")
        val FOCUS_DND_LAST_APP_SET_AT_MS = longPreferencesKey("focus_dnd_last_app_set_at_ms")
    }

    // flows with defaults
    val focusDndEnabledFlow: Flow<Boolean> = dataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs -> prefs[Keys.FOCUS_DND_ENABLED] ?: false }

    val focusDndModeFlow: Flow<Mode> = dataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs ->
            when (prefs[Keys.FOCUS_DND_MODE] ?: "PRIORITY") {
                "NONE" -> Mode.NONE
                else -> Mode.PRIORITY
            }
        }

    val focusDndMinOnMinutesFlow: Flow<Int> = dataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs -> prefs[Keys.FOCUS_DND_MIN_ON_MINUTES] ?: 2 }

    val focusDndOffGraceSecondsFlow: Flow<Int> = dataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs -> prefs[Keys.FOCUS_DND_OFF_GRACE_SECONDS] ?: 30 }

    val focusDndPrevFilterFlow: Flow<Int?> = dataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs -> prefs[Keys.FOCUS_DND_PREV_FILTER] }

    val focusDndAppliedByAppFlow: Flow<Boolean> = dataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs -> prefs[Keys.FOCUS_DND_APPLIED_BY_APP] ?: false }

    val focusDndLastAppSetAtMsFlow: Flow<Long> = dataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs -> prefs[Keys.FOCUS_DND_LAST_APP_SET_AT_MS] ?: 0L }

    // convenience suspend getters
    suspend fun getFocusDndEnabled(): Boolean = dataStore.data.map { it[Keys.FOCUS_DND_ENABLED] ?: false }.first()
    suspend fun getFocusDndMode(): Mode = dataStore.data.map { prefs ->
        when (prefs[Keys.FOCUS_DND_MODE] ?: "PRIORITY") {
            "NONE" -> Mode.NONE
            else -> Mode.PRIORITY
        }
    }.first()
    suspend fun getFocusDndMinOnMinutes(): Int = dataStore.data.map { it[Keys.FOCUS_DND_MIN_ON_MINUTES] ?: 2 }.first()
    suspend fun getFocusDndOffGraceSeconds(): Int = dataStore.data.map { it[Keys.FOCUS_DND_OFF_GRACE_SECONDS] ?: 30 }.first()
    suspend fun getFocusDndPrevFilter(): Int? = dataStore.data.map { it[Keys.FOCUS_DND_PREV_FILTER] }.first()
    suspend fun getFocusDndAppliedByApp(): Boolean = dataStore.data.map { it[Keys.FOCUS_DND_APPLIED_BY_APP] ?: false }.first()
    suspend fun getLastAppSetAtMs(): Long = dataStore.data.map { it[Keys.FOCUS_DND_LAST_APP_SET_AT_MS] ?: 0L }.first()

    // convenience non-flow accessors (suspend)
    suspend fun setFocusDndEnabled(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[Keys.FOCUS_DND_ENABLED] = enabled }
    }

    suspend fun setFocusDndMode(mode: Mode) {
        dataStore.edit { prefs -> prefs[Keys.FOCUS_DND_MODE] = mode.name }
    }

    suspend fun setFocusDndMinOnMinutes(minutes: Int) {
        dataStore.edit { prefs -> prefs[Keys.FOCUS_DND_MIN_ON_MINUTES] = minutes.coerceIn(0, 30) }
    }

    suspend fun setFocusDndOffGraceSeconds(seconds: Int) {
        dataStore.edit { prefs -> prefs[Keys.FOCUS_DND_OFF_GRACE_SECONDS] = seconds.coerceIn(0, 300) }
    }

    suspend fun setPrevFilter(filter: Int?) {
        dataStore.edit { prefs ->
            if (filter == null) prefs.remove(Keys.FOCUS_DND_PREV_FILTER)
            else prefs[Keys.FOCUS_DND_PREV_FILTER] = filter
        }
    }

    suspend fun clearPrevFilter() = setPrevFilter(null)

    suspend fun setAppliedByApp(applied: Boolean) {
        dataStore.edit { prefs -> prefs[Keys.FOCUS_DND_APPLIED_BY_APP] = applied }
    }

    suspend fun setLastAppSetAtMs(ms: Long) {
        dataStore.edit { prefs -> prefs[Keys.FOCUS_DND_LAST_APP_SET_AT_MS] = ms }
    }
}
