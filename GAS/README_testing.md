# Discord WebHook通知システム テストスイート

## 📋 概要

Discord WebHook通知システムの動作確認用Pythonテストスクリプト集です。

## 🛠 セットアップ

### 1. Python環境準備
```bash
# Python 3.7以上が必要
python3 --version

# 必要なライブラリをインストール
pip install -r requirements_testing.txt
```

### 2. GAS WebApp URLの設定

#### 方法1: 自動設定（推奨）
```bash
# デプロイしたGAS WebApp URLで一括設定
python3 test_quick_setup.py https://script.google.com/macros/s/AKfycbx.../exec
```

#### 方法2: 手動設定
各テストファイル内の以下の行を編集:
```python
gas_endpoint = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```
`YOUR_SCRIPT_ID`を実際のスクリプトIDに置換

## 🧪 テストスクリプト

### 1. `test_notification_system.py` - 包括的テスト

**用途**: システム全体の動作確認

```bash
python3 test_notification_system.py <GAS_ENDPOINT_URL>
```

**実行内容**:
- ✅ 基本接続テスト
- ✅ 新APIエンドポイントテスト
- ✅ Discord通知テスト（全種類）
- ✅ テスト機体作成・タイムアウト・復帰シナリオ
- ✅ 自動クリーンアップ

**実行例**:
```bash
# URL設定済みの場合
python3 test_notification_system.py

# または直接URL指定
python3 test_notification_system.py https://script.google.com/macros/s/ABC123.../exec
```

### 2. `test_timeout_simulation.py` - タイムアウトシナリオテスト

**用途**: 各種タイムアウトシナリオの詳細テスト

```bash
python3 test_timeout_simulation.py <GAS_ENDPOINT> [OPTIONS]
```

**オプション**:
- `--scenario basic` : 基本タイムアウト（15分前のデータ）
- `--scenario reminder` : リマインダー通知テスト
- `--scenario recovery` : 復帰通知テスト
- `--scenario battery` : バッテリー劣化シナリオ
- `--scenario intermittent` : 断続的接続問題
- `--scenario interactive` : 対話的テストモード
- `--machine-id XXX` : 使用する機体IDを指定

**実行例**:
```bash
# 基本タイムアウトテスト（URL設定済み）
python3 test_timeout_simulation.py --scenario basic

# リマインダー通知テスト
python3 test_timeout_simulation.py --scenario reminder

# 対話的モード
python3 test_timeout_simulation.py --scenario interactive

# 直接URL指定も可能
python3 test_timeout_simulation.py https://script.google.com/.../exec --scenario basic
```

### 3. `test_api_compatibility.py` - API互換性テスト

**用途**: 既存フロントエンドとの互換性確認

```bash
# URL設定済みの場合
python3 test_api_compatibility.py

# または直接URL指定
python3 test_api_compatibility.py https://script.google.com/.../exec
```

**実行内容**:
- ✅ 既存APIエンドポイント動作確認
- ✅ レスポンス形式の互換性チェック
- ✅ 新機能が既存機能に影響しないことを確認
- ✅ パフォーマンステスト

## 🎯 テストシナリオ詳細

### タイムアウトシナリオ

#### 1. Basic Timeout (`--scenario basic`)
```
1. 15分前のテレメトリデータを送信
2. 機体をアクティブ状態に設定
3. 手動チェックをトリガー
→ Discord: 🚨 初回信号ロスト通知
```

#### 2. Reminder Notifications (`--scenario reminder`)
```
1. 25分前のテレメトリデータを送信
2. 機体をアクティブ状態に設定
3. 複数回の手動チェックをトリガー
→ Discord: 🚨 初回通知 → ⚠️ リマインダー通知1 → ⚠️ リマインダー通知2
```

#### 3. Recovery (`--scenario recovery`)
```
1. 現在時刻のテレメトリデータを送信
2. 手動チェックをトリガー
→ Discord: ✅ 信号復帰通知
```

#### 4. Battery Degradation (`--scenario battery`)
```
1. バッテリー劣化タイムラインを作成:
   - 0分前: 4.2V (満充電)
   - 5分前: 3.8V (良好)
   - 10分前: 3.4V (中程度)
   - 15分前: 3.0V (低下)
   - 20分前: 2.8V (危険)
2. タイムアウトチェック
→ Discord: 🚨 バッテリー劣化履歴付き信号ロスト通知
```

#### 5. Interactive Mode (`--scenario interactive`)
```
対話的にテレメトリデータを送信:
1. 現在のデータ送信
2. 古いデータ送信（15分前）
3. 非常に古いデータ送信（30分前）
4. アクティブ/非アクティブ切り替え
5. 手動チェック実行
q. 終了
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. 通知が送信されない
```bash
# 設定確認
python3 test_notification_system.py <URL>
```
- Discord WebHook URLが正しく設定されているか確認
- `ENABLE_NOTIFICATIONS`が`true`に設定されているか確認

#### 2. タイムアウトが検知されない
```bash
# 機体状態確認
python3 test_timeout_simulation.py <URL> --scenario interactive
```
- 機体がアクティブ状態（K1セル=TRUE）になっているか確認
- 実際にタイムアウト時間（10分）が経過しているか確認

#### 3. API互換性エラー
```bash
# 互換性詳細確認
python3 test_api_compatibility.py <URL>
```
- エラーログで具体的な問題を確認
- レスポンス形式の変更がないか確認

### デバッグのヒント

#### ログの確認
1. **Pythonスクリプトログ**: 実行時に表示される詳細ログ
2. **GAS実行ログ**: Google Apps Script エディタの実行履歴
3. **Discord通知**: 実際に送信された通知内容

#### 手動確認
```bash
# 基本接続テスト
curl "https://script.google.com/.../exec?action=getMachineList"

# 監視状態確認
curl "https://script.google.com/.../exec?action=getMonitoringStats"
```

## 📊 テスト結果の見方

### 成功パターン
```
[10:30:15] ✅ Connection successful
[10:30:16] ✅ getMonitoringStats working
[10:30:17] ✅ Test machine TEST_1690876215 created
[10:30:18] ✅ Telemetry sent (timestamp: 2025/07/24 10:15:15)
[10:30:19] ✅ Active status set to True
[10:30:20] ✅ Manual check completed - Status: lost
[10:30:21] ✅ Check Discord for signal lost notification!
```

### エラーパターン
```
[10:30:15] ❌ Discord WebHook URL is not configured
[10:30:16] ❌ Machine check failed: Machine not found
[10:30:17] ❌ HTTP error 500 for getMonitoringStats
```

## 🚀 推奨テスト手順

### 初回デプロイ時
1. **API互換性テスト**:
   ```bash
   python3 test_api_compatibility.py <URL>
   ```

2. **基本機能テスト**:
   ```bash
   python3 test_notification_system.py <URL>
   ```

3. **シナリオ別テスト**:
   ```bash
   python3 test_timeout_simulation.py <URL> --scenario basic
   python3 test_timeout_simulation.py <URL> --scenario recovery
   ```

### 運用中のテスト
```bash
# 定期的な動作確認
python3 test_notification_system.py <URL>

# 特定シナリオのテスト
python3 test_timeout_simulation.py <URL> --scenario interactive
```

## 🎉 期待される結果

### Discord通知サンプル

#### 🚨 信号ロスト通知
```
Machine Signal Lost
Signal from machine TEST001 has been lost

Machine ID: TEST001
Last Data Received: 2025/07/24 10:15:15
Duration Lost: 15 minutes
Last Position: Lat: 35.6762, Lng: 139.6503, Alt: 50m
Battery: 3.0V
GPS Satellites: 8
```

#### ⚠️ リマインダー通知
```
Machine Signal Lost Continues
Machine TEST001 signal loss continues (notification #2)

Machine ID: TEST001
Lost Duration: 25 minutes
Notification Count: #2
Last Data Received: 2025/07/24 10:05:15
Last Position: Lat: 35.6762, Lng: 139.6503
Last Battery: 3.0V
```

#### ✅ 復帰通知
```
Machine Signal Recovered
Machine TEST001 communication has been restored

Machine ID: TEST001
Recovery Time: 2025/07/24 10:35:15
Total Lost Duration: 25 minutes
Total Notifications Sent: 2 times
```

これらのテストスクリプトを使用して、Discord WebHook通知システムの動作を包括的に確認できます。