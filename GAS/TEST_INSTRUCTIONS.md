# Discord Monitoring System - Test Instructions

## 📋 テスト前準備

### 1. GAS環境準備
1. **Discord Webhook URLの設定**
   ```javascript
   // GAS Editor内の getDiscordWebhookUrl() 関数で設定
   const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR_ACTUAL_URL";
   ```

2. **システム初期化**
   ```javascript
   // GAS Editorで実行
   initializeMonitoringSystem();
   ```

3. **システム状態確認**
   ```javascript
   // GAS Editorで実行
   getMonitoringSystemStatus();
   ```

### 2. Python環境準備
```bash
pip install requests
```

### 3. テストスクリプトの設定
各Pythonファイルで以下を設定：
```python
GAS_WEBAPP_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

## 🚀 テストシナリオ

### シナリオ1: 基本機能テスト (quick_test.py)
**目的**: 基本的なデータ送信と監視機能の確認

**実行手順**:
1. `python quick_test.py` を実行
2. オプション1で機体シート作成
3. Google Sheetsで該当シートのK1セルを"Active"に設定
4. オプション3でクイックオフラインテスト実行

**期待結果**:
- 機体シートが作成される
- データが正常に送信される
- 12分後にDiscordアラート
- 復旧時にDiscord復旧通知

### シナリオ2: 包括的テスト (test_discord_monitoring.py)
**目的**: 複数機体と各種機能の総合テスト

**実行手順**:
1. `python test_discord_monitoring.py` を実行
2. オプション1で複数機体作成 (00453, 00454, 00455)
3. Google Sheetsで各機体のK1セルを"Active"に設定
4. オプション4でオフラインシミュレーション実行

**期待結果**:
- 複数機体の同時監視
- 個別機体のアラート/復旧通知
- 重複防止機能の動作確認

### シナリオ3: 高度テスト (advanced_monitoring_test.py)
**目的**: 負荷テストと複雑なシナリオ

**実行手順**:
1. `python advanced_monitoring_test.py` を実行
2. オプション2で30分間の複数機体シミュレーション
3. 各機体シートのK1セルを適宜設定

**期待結果**:
- 複数機体の長時間運用
- 通信失敗のシミュレーション
- システムの安定性確認

## 📊 テスト結果確認

### GAS側確認コマンド
```javascript
// システム全体状況
getMonitoringSystemStatus()

// 全機体詳細状況
getAllMachineStatuses()

// アラート履歴
getAlertHistory()

// テストシナリオ実行
testMonitoringScenarios()

// 手動監視実行
manualMonitoringExecution()
```

### Discord確認項目
1. **アラート通知の内容**:
   - 機体ID
   - 最終更新時刻
   - オフライン継続時間
   - 適切な色（赤色）

2. **復旧通知の内容**:
   - 機体ID
   - 復旧時刻
   - オフライン総時間
   - 適切な色（緑色）

## ✅ テストチェックリスト

### 基本機能
- [ ] 機体シート自動作成
- [ ] K列運用状況選択（Active/Inactive/Maintenance）
- [ ] telemetry_data.json形式でのデータ受信
- [ ] 既存API（doGet/doPost）の互換性維持

### 監視機能
- [ ] Active機体の10分閾値監視
- [ ] Discord Webhook通知送信
- [ ] アラート通知内容（機体ID、時刻、経過時間）
- [ ] 復旧通知内容

### アラート管理
- [ ] 24時間重複防止（クールダウン）
- [ ] アラート履歴記録
- [ ] 復旧時の状態リセット

### システム管理
- [ ] 監視有効/無効切り替え
- [ ] 5分間隔自動実行トリガー
- [ ] エラーハンドリングと復旧
- [ ] ログ出力（全て英語）

### 性能・安定性
- [ ] 複数機体同時監視
- [ ] 長時間運用安定性
- [ ] GAS実行時間内での完了
- [ ] メモリ使用量制御

## 🐛 トラブルシューティング

### よくある問題

1. **Webhook通知が送信されない**
   ```javascript
   // Discord URL確認
   getDiscordWebhookUrl()
   // テスト通知
   testDiscordNotification()
   ```

2. **機体がActive状態になっていない**
   ```javascript
   // 全機体状況確認
   getAllMachineStatuses()
   ```

3. **監視が実行されていない**
   ```javascript
   // トリガー状況確認
   isMonitoringTriggerInstalled()
   // 手動監視実行
   manualMonitoringExecution()
   ```

4. **アラートが重複送信される**
   ```javascript
   // アラート履歴確認
   getAlertHistory()
   // 履歴クリア（必要に応じて）
   clearAlertHistory()
   ```

### デバッグ用コマンド
```javascript
// 全システム状況
getMonitoringSystemStatus()

// 詳細ログ付き監視実行
manualMonitoringExecution()

// 設定確認
Logger.log("Monitoring enabled:", isMonitoringEnabled())
Logger.log("Threshold:", getAlertThresholdMinutes())
Logger.log("Cooldown:", getCooldownHours())
```

## 📈 期待されるテスト結果

### 成功基準
1. **基本動作**: データ送受信100%成功率
2. **監視精度**: 10分±30秒以内でのアラート発生
3. **通知内容**: 全必要情報の正確な表示
4. **重複防止**: 24時間以内の重複アラートなし
5. **復旧検知**: データ再開後5分以内の復旧通知
6. **システム安定性**: 長時間運用でのエラーなし

### パフォーマンス基準
- GAS実行時間: 30秒以内
- Discord通知送信: 5秒以内
- API応答時間: 既存機能への影響なし

---

**注意**: テスト実行前に必ずDiscord WebhookのURLとGAS WebAppのURLを正しく設定してください。