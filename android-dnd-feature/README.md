# Focus DND Feature (Android)

概要
- このサブフォルダは、アプリが「集中状態になったら DND を有効化」するための参考実装を含みます。
- 実装は Kotlin / Coroutine / DataStore / Jetpack Compose（設定画面）を想定しています。

含まれるファイル
- `AndroidManifest.xml` - 必要な permission のスニペット
- `FocusDndController.kt` - DND 制御ロジック（ヒステリシス、永続化、権限チェック、ログ）
- `SettingsRepository.kt` - DataStore を用いた設定保存ラッパー
- `DndUtils.kt` - 権限チェックや設定画面遷移のヘルパー
- `SettingsScreen.kt` - Compose ベースの設定画面サンプル

統合手順（要約）
1. 既存の Android モジュールに以下を追加または統合します。
   - このディレクトリの Kotlin ファイルを `src/main/java/<your-package>/...` に配置
   - `AndroidManifest.xml` の permission をあなたの AndroidManifest に追加
   - DataStore の準備（下記の例を参照）

2. DataStore の作成例（Application クラス内）
```kotlin
val dataStore: DataStore<Preferences> = PreferenceDataStoreFactory.create(
    produceFile = { File(applicationContext.filesDir, "datastore/preferences.preferences_pb") }
)
val settingsRepository = SettingsRepository(dataStore)
```

3. FocusDndController のインスタンス化
```kotlin
val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
val controller = FocusDndController(applicationContext, nm, settingsRepository, scope)

// 集中状態の変化を受けて呼ぶ
controller.onFocusStateChanged(isFocused)
```

制約・注意点
- 実行にはユーザーの DND 設定アクセス許可（Notification policy access）が必要です。
- NONE モードは強力なブロッキング動作をするため、UI 上で警告を表示してください。
- Android のバージョンやメーカーによる DND 実装差に注意してください。

テスト方法
- 設定でトグルをオンにして権限を許可すると、集中が継続したあと NotificationManager の interruptionFilter が変わることを確認します。
- トグルオフ・権限未許可時は変更されないことを確認します。

手動変更検知
- BroadcastReceiver を使って `NotificationManager.ACTION_INTERRUPTION_FILTER_CHANGED` を監視します。
- アプリが setInterruptionFilter を呼んだ直後に発生する通知は "自分の変更" として無視するため、
    「最後にアプリが setInterruptionFilter した時刻」を DataStore に保存し、受信時刻との差が短ければ無視します（サンプルでは 1500ms）。
- それ以外の変化は "ユーザー手動変更" とみなし、`focus_dnd_applied_by_app=false` を即時クリアし、
    `focus_dnd_prev_filter` を現在の interruptionFilter に更新します。

注意: 監視は端末やベンダーによって遅延が発生する場合があり、無視ウィンドウ（例: 1500ms）は調整が必要です。
