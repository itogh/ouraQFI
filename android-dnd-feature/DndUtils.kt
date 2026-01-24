package com.example.focusdnd

import android.content.Context
import android.os.Build
import android.app.NotificationManager
import android.provider.Settings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

object DndUtils {
    fun isNotificationPolicyAccessGranted(context: Context): Boolean {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return nm.isNotificationPolicyAccessGranted
    }

    // simple reactive wrapper (not hot); caller can collect when needed
    fun isNotificationPolicyAccessGrantedFlow(context: Context): Flow<Boolean> = flow {
        emit(isNotificationPolicyAccessGranted(context))
    }
}
