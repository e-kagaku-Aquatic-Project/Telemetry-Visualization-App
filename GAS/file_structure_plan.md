# GASファイル分割計画書

## 1. 分割の目的

### 1.1 現状の課題
- SpreadSheets_GAS.gsが約500行となり管理が困難
- 機能追加により更なる行数増加が予想される
- 機能別の責任分離ができていない
- 新機能（Discord WebHook）の追加で複雑性が増大

### 1.2 分割による利点
- 機能別の責任分離による保守性向上
- 複数人での開発・保守作業の効率化
- 単体テストの実施容易性
- コードの再利用性向上

## 2. ファイル分割構成

### 2.1 ファイル構成一覧

```
Google Apps Script プロジェクト/
├── Main.gs                    # メインエントリーポイント
├── DataManager.gs             # データ管理機能
├── WebhookNotification.gs     # Discord WebHook通知機能
├── MachineMonitor.gs          # 機体監視・状態管理
├── Utils.gs                   # ユーティリティ関数
├── Config.gs                  # 設定管理
└── Test.gs                    # テスト関数
```

### 2.2 各ファイルの責任範囲

#### Main.gs
- **責任**: WebAppのエントリーポイント
- **機能**:
  - `doGet()`: GET リクエストの振り分け
  - `doPost()`: POST リクエストの振り分け
  - エラーハンドリングの統一的な処理

```javascript
// Main.gs の主要関数
function doGet(e) { ... }
function doPost(e) { ... }
```

#### DataManager.gs
- **責任**: データの保存・取得・管理
- **機能**:
  - スプレッドシートへのデータ保存
  - 機体データの取得（個別・全体・リスト）
  - シート作成・管理
  - データフォーマット変換

```javascript
// DataManager.gs の主要関数
function saveToSpreadsheet(data) { ... }
function getAllMachinesData() { ... }
function getMachineData(machineId) { ... }
function getMachineList() { ... }
function createNewSheet(spreadsheet, sheetName) { ... }
function registerMachine(data) { ... }
function getMachineDataFromSheet(sheet) { ... }
```

#### WebhookNotification.gs
- **責任**: Discord WebHook通知機能
- **機能**:
  - 信号ロスト通知の送信
  - 信号復帰通知の送信
  - Discord Embed形式のメッセージ作成
  - WebHook送信のリトライ機能

```javascript
// WebhookNotification.gs の主要関数
function sendLostNotification(machine) { ... }
function sendRecoveryNotification(machine) { ... }
function sendDiscordNotification(payload) { ... }
function createLostEmbed(machine) { ... }
function createRecoveryEmbed(machine) { ... }
```

#### MachineMonitor.gs
- **責任**: 機体の監視・状態管理
- **機能**:
  - 定期監視処理
  - アクティブ機体の取得
  - タイムアウトチェック
  - 監視状態の管理

```javascript
// MachineMonitor.gs の主要関数
function checkMachineSignals() { ... }
function getActiveMachines(spreadsheet) { ... }
function checkMachineTimeout(machine, monitorStatus) { ... }
function getMonitorStatus(spreadsheet) { ... }
function updateMonitorStatus(spreadsheet, status) { ... }
```

#### Utils.gs
- **責任**: 共通ユーティリティ機能
- **機能**:
  - 日時フォーマット
  - 監視状態シートの管理
  - エラーログ機能
  - レスポンス作成ヘルパー

```javascript
// Utils.gs の主要関数
function formatTimestamp(timestamp) { ... }
function formatDateTimeJST(date) { ... }
function getOrCreateMonitorSheet(spreadsheet) { ... }
function createSuccessResponse(data) { ... }
function createErrorResponse(message) { ... }
function logError(context, error) { ... }
function getLastUpdateTime(sheet) { ... }
```

#### Config.gs
- **責任**: 設定管理・初期化
- **機能**:
  - スクリプトプロパティの管理
  - トリガーの設定・管理
  - 初期設定処理
  - 設定値の取得・更新

```javascript
// Config.gs の主要関数・定数
const CONFIG = { ... }
function getScriptProperty(key) { ... }
function setScriptProperty(key, value) { ... }
function setupTriggers() { ... }
function initialSetup() { ... }
function deleteTriggers() { ... }
```

#### Test.gs
- **責任**: テスト機能
- **機能**:
  - 既存のテスト関数
  - 新機能のテスト関数
  - 統合テスト

```javascript
// Test.gs の主要関数
function testFunction() { ... }
function testWebAppAPI() { ... }
function testDiscordNotification() { ... }
function testMachineMonitoring() { ... }
function testConfigSetup() { ... }
```

## 3. 移行手順

### 3.1 段階的移行アプローチ

#### Phase 1: ファイル分割準備
1. 現在のSpreadSheets_GAS.gsをバックアップ
2. Google Apps Scriptプロジェクトで新しいファイルを作成
3. 各ファイルに該当する関数をコピー

#### Phase 2: 機能単位での移行
1. **Utils.gs**から開始（依存関係が少ない）
2. **Config.gs**の作成・設定
3. **DataManager.gs**の移行
4. **Main.gs**の分離
5. **Test.gs**の整理

#### Phase 3: 新機能の追加
1. **MachineMonitor.gs**の作成
2. **WebhookNotification.gs**の作成
3. 統合テストの実施

### 3.2 移行時の注意点

#### 3.2.1 Google Apps Scriptの制約事項
- ファイル間でのグローバル変数共有は制限される
- 関数呼び出しは通常通り可能
- const/let/varの扱いに注意

#### 3.2.2 依存関係の管理
```
Main.gs 
├── DataManager.gs
├── Config.gs
└── Utils.gs

MachineMonitor.gs
├── WebhookNotification.gs
├── DataManager.gs
├── Config.gs
└── Utils.gs

WebhookNotification.gs
├── Config.gs
└── Utils.gs
```

## 4. コーディング規約

### 4.1 命名規約
- **ファイル名**: PascalCase (`DataManager.gs`)
- **関数名**: camelCase (`getMachineData`)
- **定数**: UPPER_SNAKE_CASE (`CONFIG`, `TIMEOUT_MINUTES`)
- **変数**: camelCase (`machineId`, `lastDataTime`)

### 4.2 関数設計原則
- 単一責任の原則：1つの関数は1つの責任のみ
- 副作用の最小化：純粋関数を心がける
- エラーハンドリング：try-catchを適切に使用
- ログ出力：重要な処理には必ずログを出力

### 4.3 ドキュメント規約
```javascript
/**
 * 機体データをスプレッドシートに保存
 * @param {Object} data - 保存するテレメトリデータ
 * @param {string} data.MachineID - 機体ID
 * @param {Object} data.GPS - GPS情報
 * @returns {Object} 保存結果オブジェクト
 * @throws {Error} スプレッドシート操作エラー
 */
function saveToSpreadsheet(data) {
  // 実装...
}
```

## 5. テスト戦略

### 5.1 単体テストの方針
- 各ファイルごとにテスト関数を作成
- モック/スタブを活用した独立テスト
- 正常系・異常系の両方をカバー

### 5.2 統合テストの方針
- ファイル間の連携テスト
- 実際のスプレッドシートを使用したE2Eテスト
- Discord WebHookの実際の送信テスト

### 5.3 テスト関数の例
```javascript
// Test.gs
function runAllTests() {
  console.log('=== 全テスト実行開始 ===');
  
  // 単体テスト
  testConfigFunctions();
  testUtilsFunctions();
  testDataManagerFunctions();
  
  // 統合テスト
  testWebAppAPI();
  testMachineMonitoring();
  
  console.log('=== 全テスト完了 ===');
}
```

## 6. デプロイメント

### 6.1 デプロイ手順
1. 各ファイルの内容をGoogle Apps Scriptプロジェクトにコピー
2. `initialSetup()`を実行して初期設定
3. スクリプトプロパティにDiscord WebHook URLを設定
4. WebAppとして公開（必要に応じて）
5. トリガーの動作確認

### 6.2 バージョン管理
- Google Apps Scriptのバージョン機能を活用
- 重要な変更前にはバックアップを作成
- 変更履歴をCLAUDE.mdまたは専用ドキュメントに記録

## 7. 保守運用

### 7.1 監視項目
- トリガーの実行状況
- エラーログの確認
- Discord通知の送信状況
- スプレッドシートの容量監視

### 7.2 定期メンテナンス
- エラーログの定期削除
- 監視状態シートのクリーンアップ
- 非アクティブ機体の整理
- パフォーマンス最適化

### 7.3 トラブルシューティング
#### よくある問題と対処法
1. **トリガーが動作しない**
   - トリガー一覧の確認
   - 実行制限の確認
   - 権限の確認

2. **Discord通知が送信されない**
   - WebHook URLの確認
   - ネットワーク接続の確認
   - Discord側の制限確認

3. **スプレッドシート読み取りエラー**
   - シート構造の確認
   - 権限の確認
   - データ形式の確認

## 8. 今後の拡張性

### 8.1 追加予定機能
- Slack通知対応
- Email通知対応
- 複数WebHook URL対応
- 機体グループ管理

### 8.2 ファイル構成の拡張
```
将来的なファイル構成例:
├── Main.gs
├── DataManager.gs
├── NotificationManager.gs     # 統合通知管理
│   ├── DiscordNotification.gs
│   ├── SlackNotification.gs
│   └── EmailNotification.gs
├── MachineMonitor.gs
├── MachineGroupManager.gs     # 機体グループ管理
├── Utils.gs
├── Config.gs
└── Test.gs
```

### 8.3 設計指針
- 新機能追加時は既存ファイル構成を尊重
- 機能が大きくなった場合は更なる分割を検討
- インターフェースの一貫性を保持
- 後方互換性の維持