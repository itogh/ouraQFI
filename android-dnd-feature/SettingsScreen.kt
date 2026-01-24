package com.example.focusdnd

import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    context: Context,
    settingsRepository: SettingsRepository,
    onOpenPermissionSettings: () -> Unit
) {
    val scope = rememberCoroutineScope()

    var enabled by remember { mutableStateOf(false) }
    var mode by remember { mutableStateOf(SettingsRepository.Mode.PRIORITY) }
    var minOn by remember { mutableStateOf(2) }
    var offGrace by remember { mutableStateOf(30) }
    var permissionGranted by remember { mutableStateOf(false) }

    LaunchedEffect(settingsRepository) {
        settingsRepository.focusDndEnabledFlow.collectLatest { enabled = it }
    }
    LaunchedEffect(settingsRepository) {
        settingsRepository.focusDndModeFlow.collectLatest { mode = it }
    }
    LaunchedEffect(settingsRepository) {
        settingsRepository.focusDndMinOnMinutesFlow.collectLatest { minOn = it }
    }
    LaunchedEffect(settingsRepository) {
        settingsRepository.focusDndOffGraceSecondsFlow.collectLatest { offGrace = it }
    }
    LaunchedEffect(Unit) {
        permissionGranted = DndUtils.isNotificationPolicyAccessGranted(context)
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("集中中に通知を抑制（DND）")
            Switch(checked = enabled, onCheckedChange = { checked ->
                enabled = checked
                scope.launch { settingsRepository.setFocusDndEnabled(checked) }
            })
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text("モード")
        Row {
            RadioButton(selected = mode == SettingsRepository.Mode.PRIORITY, onClick = {
                mode = SettingsRepository.Mode.PRIORITY
                scope.launch { settingsRepository.setFocusDndMode(mode) }
            })
            Text("PRIORITY (優先のみ)")
        }
        Row {
            RadioButton(selected = mode == SettingsRepository.Mode.NONE, onClick = {
                mode = SettingsRepository.Mode.NONE
                scope.launch { settingsRepository.setFocusDndMode(mode) }
            })
            Text("NONE (割り込みなし)")
        }
        if (mode == SettingsRepository.Mode.NONE) {
            Text("警告: NONE は緊急着信も含めて割り込みを遮断する可能性があります", color = MaterialTheme.colorScheme.error)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text("ONにする最低継続時間（分）: $minOn")
        Slider(value = minOn.toFloat(), onValueChange = { v -> minOn = v.toInt() }, valueRange = 0f..30f, onValueChangeFinished = {
            scope.launch { settingsRepository.setFocusDndMinOnMinutes(minOn) }
        })

        Spacer(modifier = Modifier.height(12.dp))

        Text("OFFに戻す猶予（秒）: $offGrace")
        Slider(value = offGrace.toFloat(), onValueChange = { v -> offGrace = v.toInt() }, valueRange = 0f..300f, onValueChangeFinished = {
            scope.launch { settingsRepository.setFocusDndOffGraceSeconds(offGrace) }
        })

        Spacer(modifier = Modifier.height(12.dp))

        Text("DNDアクセス: ${if (permissionGranted) "許可" else "未許可"}")
        Button(onClick = { onOpenPermissionSettings() }) {
            Text("DNDアクセスを許可する")
        }
    }
}
