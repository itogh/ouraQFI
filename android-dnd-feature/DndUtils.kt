package com.example.focusdnd

import android.content.Context
import android.os.Build
import android.app.NotificationManager
import android.provider.Settings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

object DndUtils {
    fun isNotificationPolicyAccessGranted(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return false
        return try {
            nm.isNotificationPolicyAccessGranted
        } catch (e: Exception) {
            false
        }
    }

    // simple reactive wrapper (not hot); caller can collect when needed
    fun isNotificationPolicyAccessGrantedFlow(context: Context): Flow<Boolean> = flow {
        emit(isNotificationPolicyAccessGranted(context))
    }
}
