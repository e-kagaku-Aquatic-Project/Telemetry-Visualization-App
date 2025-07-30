# Telemetry Tracking System v2.0 セットアップガイド

## 概要
このシステムは、機体からのテレメトリーデータをGoogle Sheetsに保存し、通信途絶時にDiscordへ通知を送信する統合システムです。

### 主な変更点（v2.0）
- **通知回数の削減**: 通信途絶時と復旧時の2回のみ通知（リマインダー通知は廃止）
- **モジュール統合**: 全機能を1つのファイルに統合

## セットアップ手順

### 1. Google Sheetsの準備
1. 新しいGoogle Sheetsを作成
2. シート名を適切な名前に変更（例：「Telemetry Tracking System」）

### 2. Apps Scriptの設定
1. Google Sheetsで `拡張機能` → `Apps Script` を開く
2. 既存のコードをすべて削除
3. `IntegratedSystem_v2.gs` の内容をすべてコピー＆ペースト
4. ファイルを保存（Ctrl+S または Cmd+S）

### 3. 初期設定の実行
1. Apps Scriptエディタで `initialSetup` 関数を選択
2. `実行` ボタンをクリック
3. 初回実行時は権限の承認が必要
   - 「このアプリは確認されていません」と表示された場合
   - 「詳細」をクリック → 「安全でないページに移動」をクリック
   - 必要な権限を承認

### 4. Discord Webhook URLの設定
1. Discord で Webhook URL を取得
   - サーバー設定 → 連携サービス → Webhook → 新しいWebhook
   - Webhook URL をコピー
2. Apps Script で設定
   - `プロジェクトの設定` → `スクリプト プロパティ`
   - 「プロパティを追加」をクリック
   - プロパティ: `DISCORD_WEBHOOK_URL`
   - 値: コピーしたWebhook URL
   - 保存

### 5. Web Appとしてデプロイ
1. Apps Scriptエディタで `デプロイ` → `新しいデプロイ`
2. 設定：
   - 種類: `ウェブアプリ`
   - 説明: 任意（例：「Telemetry System v2.0」）
   - 実行するユーザー: `自分`
   - アクセスできるユーザー: `全員`
3. `デプロイ` をクリック
4. 表示されるWeb App URLをコピー（テレメトリーデータ送信用）

### 6. システムの動作確認

#### Discord通知のテスト
```javascript
// Apps Scriptエディタで実行
testDiscordNotifications()
```
以下の通知がDiscordに送信されます：
- 接続テスト通知
- 通信途絶テスト通知
- 通信復旧テスト通知

#### システム全体のテスト
```javascript
// Apps Scriptエディタで実行
quickSystemTest()
```

## 使用方法

### テレメトリーデータの送信
POST リクエストで以下の形式のJSONを送信：
```json
{
  "DataType": "HK",
  "MachineID": "00453",
  "MachineTime": "2025/07/16 00:41:41",
  "GPS": {
    "LAT": 34.124125,
    "LNG": 153.131241,
    "ALT": 342.5,
    "SAT": 43
  },
  "BAT": 3.45,
  "CMT": "通常動作中"
}
```

### 機体の登録
```json
{
  "action": "registerMachine",
  "MachineID": "NEW001",
  "metadata": {
    "type": "drone",
    "model": "X-100"
  }
}
```

### 機体のアクティブ状態変更
```json
{
  "action": "setActiveStatus",
  "machineId": "00453",
  "isActive": true
}
```

### データ取得API

#### 全機体データ取得
```
GET: {WebAppURL}?action=getAllMachines
```

#### 特定機体データ取得
```
GET: {WebAppURL}?action=getMachine&machineId=00453
```

#### 機体リスト取得
```
GET: {WebAppURL}?action=getMachineList
```

#### 監視統計取得
```
GET: {WebAppURL}?action=getMonitoringStats
```

## 通知の仕組み

### 通信途絶通知（1回のみ）
- 最後のデータ受信から10分経過後に送信
- 以下の情報を含む：
  - 機体ID
  - 最終データ受信時刻
  - 最終位置情報
  - バッテリー電圧
  - GPS衛星数

### 通信復旧通知（1回のみ）
- 通信途絶状態から正常に戻った時に送信
- 以下の情報を含む：
  - 機体ID
  - 復旧時刻
  - 総途絶時間

### リマインダー通知（廃止）
- v2.0では削除されました
- 通知は通信途絶時と復旧時の2回のみ

## トラブルシューティング

### 通知が送信されない
1. `CONFIG.DISCORD_WEBHOOK_URL` が正しく設定されているか確認
2. `CONFIG.ENABLE_NOTIFICATIONS` が `true` になっているか確認
3. 機体のアクティブ状態（K1セル）が有効になっているか確認
4. トリガーが正しく設定されているか確認

### データが保存されない
1. Web App URLが正しいか確認
2. POSTデータの形式が正しいか確認
3. 実行ログでエラーを確認

### エラーログの確認
- Google Sheetsに `_ErrorLog` シートが自動作成される
- Apps Scriptエディタの「実行数」でログを確認

## 設定のカスタマイズ

スクリプトプロパティで以下の設定を変更可能：
- `TIMEOUT_MINUTES`: タイムアウト時間（デフォルト: 10分）
- `CHECK_INTERVAL_MINUTES`: チェック間隔（デフォルト: 1分）
- `ENABLE_NOTIFICATIONS`: 通知の有効/無効（デフォルト: true）

## Python テストスクリプト

### 基本的なデータ送信
```python
import requests
import json
from datetime import datetime

# Web App URL
url = "YOUR_WEB_APP_URL"

# テストデータ
data = {
    "DataType": "HK",
    "MachineID": "TEST001",
    "MachineTime": datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
    "GPS": {
        "LAT": 35.6762,
        "LNG": 139.6503,
        "ALT": 25.0,
        "SAT": 12
    },
    "BAT": 3.85,
    "CMT": "Test data"
}

# 送信
response = requests.post(url, json=data)
print(response.json())
```

### 通信途絶シミュレーション
```python
import time

# 1. 初回データ送信
send_data()

# 2. 11分待機（通信途絶をシミュレート）
print("Waiting 11 minutes to simulate signal loss...")
time.sleep(11 * 60)

# 3. データを再送信（復旧をシミュレート）
send_data()
```

## 注意事項
- Google Apps Scriptの実行時間制限（6分/実行）があります
- 大量の機体を監視する場合は、実行時間に注意してください
- Discord Webhookにはレート制限があります（30リクエスト/分）