# Discord WebHook信号ロスト通知機能 詳細設計書

## 1. システム構成

### 1.1 ファイル構成
GASコードを以下の複数ファイルに分割して管理する：

```
Google Apps Script プロジェクト/
├── Main.gs                    # メインエントリーポイント（doGet, doPost）
├── DataManager.gs             # データ保存・取得関連
├── WebhookNotification.gs     # Discord WebHook通知関連
├── MachineMonitor.gs          # 機体監視・状態管理
├── Utils.gs                   # ユーティリティ関数
└── Config.gs                  # 設定管理
```

### 1.2 データ構造

#### 1.2.1 シートヘッダー拡張
既存のヘッダーにK列を追加し、K1セルで機体のアクティブ状態を管理：
```javascript
const headers = [
  "GAS Time",          // A列
  "MachineTime",       // B列
  "MachineID",         // C列
  "DataType",          // D列
  "Latitude",          // E列
  "Longitude",         // F列
  "Altitude",          // G列
  "GPS Satellites",    // H列
  "Battery",           // I列
  "Comment",           // J列
  "IsActive"           // K列（K1セルで機体状態管理）
];
```

**重要**: K1セル（1行目のK列）のみが機体のアクティブ状態を示し、データ行（2行目以降）のK列は使用しない。

#### 1.2.2 機体監視状態管理用シート
新規シート「_MachineMonitorStatus」を追加して監視状態を管理：
```
| MachineID | LastNotified | NotificationStatus | LastDataReceived | NotificationCount | FirstLostTime |
|-----------|--------------|-------------------|------------------|-------------------|---------------|
| 00453     | 2025-07-24...| lost              | 2025-07-24...    | 3                 | 2025-07-24...|
| 00454     | null         | normal            | 2025-07-24...    | 0                 | null          |
```

**追加フィールド**:
- `NotificationCount`: 送信した通知回数
- `FirstLostTime`: 初回ロスト検知時刻

### 1.3 Discord WebHook仕様

#### 1.3.1 通知形式
Discord Embedフォーマットを使用（全て英語）：
```javascript
{
  "embeds": [{
    "title": "🚨 Machine Signal Lost",
    "description": `Signal from machine ${machineId} has been lost`,
    "color": 15158332,  // Red color
    "fields": [
      {
        "name": "Machine ID",
        "value": machineId,
        "inline": true
      },
      {
        "name": "Last Data Received",
        "value": lastDataReceived,
        "inline": true
      },
      {
        "name": "Last Position",
        "value": `Lat: ${lat}\nLng: ${lng}\nAlt: ${alt}m`,
        "inline": false
      },
      {
        "name": "Battery",
        "value": `${battery}V`,
        "inline": true
      },
      {
        "name": "GPS Satellites",
        "value": satellites,
        "inline": true
      }
    ],
    "timestamp": new Date().toISOString(),
    "footer": {
      "text": "Telemetry Monitoring System"
    }
  }]
}
```

## 2. 機能詳細設計

### 2.1 Config.gs - 設定管理

```javascript
// スクリプトプロパティから設定を取得
const CONFIG = {
  DISCORD_WEBHOOK_URL: getScriptProperty('DISCORD_WEBHOOK_URL'),
  TIMEOUT_MINUTES: parseInt(getScriptProperty('TIMEOUT_MINUTES') || '10'),
  CHECK_INTERVAL_MINUTES: parseInt(getScriptProperty('CHECK_INTERVAL_MINUTES') || '1'),
  REMINDER_INTERVAL_MINUTES: parseInt(getScriptProperty('REMINDER_INTERVAL_MINUTES') || '10'),
  ENABLE_NOTIFICATIONS: getScriptProperty('ENABLE_NOTIFICATIONS') === 'true',
  MAX_RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000
};

function getScriptProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setScriptProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}
```

### 2.2 MachineMonitor.gs - 機体監視機能

```javascript
/**
 * 定期監視トリガー関数（1分毎に実行）
 */
function checkMachineSignals() {
  if (!CONFIG.ENABLE_NOTIFICATIONS) {
    console.log('Notification system is disabled');
    return;
  }
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const activeMachines = getActiveMachines(spreadsheet);
  const monitorStatus = getMonitorStatus(spreadsheet);
  
  activeMachines.forEach(machine => {
    checkMachineTimeout(machine, monitorStatus);
  });
  
  updateMonitorStatus(spreadsheet, monitorStatus);
}

/**
 * アクティブな機体リストを取得
 */
function getActiveMachines(spreadsheet) {
  const sheets = spreadsheet.getSheets();
  const activeMachines = [];
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName.startsWith('Machine_')) {
      const machineId = sheetName.replace('Machine_', '');
      
      // K1セル（1行目K列）のアクティブフラグを確認
      const isActive = sheet.getRange(1, 11).getValue();
      if (isActive === true || isActive === 'TRUE') {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const lastDataTime = sheet.getRange(lastRow, 1).getValue();
          const lastData = sheet.getRange(lastRow, 1, 1, 10).getValues()[0];
          
          activeMachines.push({
            machineId: machineId,
            sheet: sheet,
            lastDataTime: lastDataTime,
            lastData: lastData
          });
        }
      }
    }
  });
  
  return activeMachines;
}

/**
 * タイムアウトチェック
 */
function checkMachineTimeout(machine, monitorStatus) {
  const now = new Date();
  const lastDataTime = new Date(machine.lastDataTime);
  const diffMinutes = (now - lastDataTime) / (1000 * 60);
  
  const currentStatus = monitorStatus[machine.machineId] || { 
    status: 'normal', 
    notificationCount: 0,
    firstLostTime: null
  };
  
  if (diffMinutes >= CONFIG.TIMEOUT_MINUTES) {
    // タイムアウト検出
    if (currentStatus.status !== 'lost') {
      // 新規ロスト検出 - 初回通知送信
      sendLostNotification(machine, 1, diffMinutes);
      monitorStatus[machine.machineId] = {
        status: 'lost',
        lastNotified: now.toISOString(),
        lastDataReceived: lastDataTime.toISOString(),
        notificationCount: 1,
        firstLostTime: now.toISOString()
      };
    } else {
      // 継続ロスト - リマインダー通知チェック
      const lastNotified = new Date(currentStatus.lastNotified);
      const minutesSinceLastNotification = (now - lastNotified) / (1000 * 60);
      
      if (minutesSinceLastNotification >= CONFIG.REMINDER_INTERVAL_MINUTES) {
        // リマインダー通知送信
        const notificationCount = currentStatus.notificationCount + 1;
        sendLostReminderNotification(machine, notificationCount, diffMinutes);
        monitorStatus[machine.machineId] = {
          ...currentStatus,
          lastNotified: now.toISOString(),
          notificationCount: notificationCount
        };
      }
    }
  } else {
    // 正常通信
    if (currentStatus.status === 'lost') {
      // 復帰検出 - 復帰通知送信
      const lostDuration = (now - new Date(currentStatus.firstLostTime)) / (1000 * 60);
      sendRecoveryNotification(machine, currentStatus.notificationCount, lostDuration);
      monitorStatus[machine.machineId] = {
        status: 'normal',
        lastNotified: now.toISOString(),
        lastDataReceived: lastDataTime.toISOString(),
        notificationCount: 0,
        firstLostTime: null
      };
    }
  }
}
```

### 2.3 WebhookNotification.gs - Discord通知機能

```javascript
/**
 * Send signal lost notification (initial)
 */
function sendLostNotification(machine, notificationCount, lostDurationMinutes) {
  const lastData = machine.lastData;
  const embed = {
    title: "🚨 Machine Signal Lost",
    description: `Signal from machine ${machine.machineId} has been lost`,
    color: 15158332, // Red color
    fields: [
      {
        name: "Machine ID",
        value: machine.machineId,
        inline: true
      },
      {
        name: "Last Data Received",
        value: formatDateTimeJST(machine.lastDataTime),
        inline: true
      },
      {
        name: "Duration Lost",
        value: `${Math.floor(lostDurationMinutes)} minutes`,
        inline: true
      },
      {
        name: "Last Position",
        value: `Lat: ${lastData[4]}\nLng: ${lastData[5]}\nAlt: ${lastData[6]}m`,
        inline: false
      },
      {
        name: "Battery",
        value: `${lastData[8]}V`,
        inline: true
      },
      {
        name: "GPS Satellites",
        value: lastData[7].toString(),
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      "text": "Telemetry Monitoring System"
    }
  };
  
  if (lastData[9]) {
    embed.fields.push({
      name: "Last Comment",
      value: lastData[9],
      inline: false
    });
  }
  
  sendDiscordNotification({ embeds: [embed] });
}

/**
 * Send signal lost reminder notification (every 10 minutes)
 */
function sendLostReminderNotification(machine, notificationCount, lostDurationMinutes) {
  const lastData = machine.lastData;
  const embed = {
    title: "⚠️ Machine Signal Lost Continues",
    description: `Machine ${machine.machineId} signal loss continues (notification #${notificationCount})`,
    color: 16753920, // Orange color
    fields: [
      {
        name: "Machine ID",
        value: machine.machineId,
        inline: true
      },
      {
        name: "Lost Duration",
        value: `${Math.floor(lostDurationMinutes)} minutes`,
        inline: true
      },
      {
        name: "Notification Count",
        value: `#${notificationCount}`,
        inline: true
      },
      {
        name: "Last Data Received",
        value: formatDateTimeJST(machine.lastDataTime),
        inline: true
      },
      {
        name: "Last Position",
        value: `Lat: ${lastData[4]}\nLng: ${lastData[5]}`,
        inline: true
      },
      {
        name: "Last Battery",
        value: `${lastData[8]}V`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      "text": "Telemetry Monitoring System - Reminder"
    }
  };
  
  sendDiscordNotification({ embeds: [embed] });
}

/**
 * Send signal recovery notification
 */
function sendRecoveryNotification(machine, totalNotificationCount, totalLostDurationMinutes) {
  const embed = {
    title: "✅ Machine Signal Recovered",
    description: `Machine ${machine.machineId} communication has been restored`,
    color: 3066993, // Green color
    fields: [
      {
        name: "Machine ID",
        value: machine.machineId,
        inline: true
      },
      {
        name: "Recovery Time",
        value: formatDateTimeJST(machine.lastDataTime),
        inline: true
      },
      {
        name: "Total Lost Duration",
        value: `${Math.floor(totalLostDurationMinutes)} minutes`,
        inline: true
      },
      {
        name: "Total Notifications Sent",
        value: `${totalNotificationCount} times`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      "text": "Telemetry Monitoring System"
    }
  };
  
  sendDiscordNotification({ embeds: [embed] });
}

/**
 * Send Discord WebHook notification
 */
function sendDiscordNotification(payload) {
  if (!CONFIG.DISCORD_WEBHOOK_URL) {
    console.error('Discord WebHook URL is not configured');
    return;
  }
  
  let retryCount = 0;
  while (retryCount < CONFIG.MAX_RETRY_COUNT) {
    try {
      const response = UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload)
      });
      
      if (response.getResponseCode() === 204) {
        console.log('Discord notification sent successfully');
        return;
      }
    } catch (error) {
      console.error(`Discord notification error (attempt ${retryCount + 1}/${CONFIG.MAX_RETRY_COUNT}):`, error);
      retryCount++;
      
      if (retryCount < CONFIG.MAX_RETRY_COUNT) {
        Utilities.sleep(CONFIG.RETRY_DELAY_MS);
      }
    }
  }
  
  console.error('Failed to send Discord notification (max retries reached)');
}
```

### 2.4 DataManager.gs - データ管理機能の拡張

既存のcreateNewSheet関数を修正：
```javascript
function createNewSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.insertSheet(sheetName);
  
  const headers = [
    "GAS Time",
    "MachineTime",
    "MachineID",
    "DataType",
    "Latitude",
    "Longitude",
    "Altitude",
    "GPS Satellites",
    "Battery",
    "Comment",
    "IsActive"  // K列追加
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // ヘッダー行の書式設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");
  
  // K1セル（IsActive）のデフォルト値をTRUEに設定
  sheet.getRange(1, 11).setValue(true);
  
  // K1セルにチェックボックスを設定
  const activeColumnRange = sheet.getRange(1, 11);
  activeColumnRange.insertCheckboxes();
  
  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
  
  return sheet;
}
```

### 2.5 Utils.gs - ユーティリティ関数

```javascript
/**
 * 日本時間でフォーマット
 */
function formatDateTimeJST(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return Utilities.formatDate(date, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
}

/**
 * 監視状態シートの取得・作成
 */
function getOrCreateMonitorSheet(spreadsheet) {
  const sheetName = '_MachineMonitorStatus';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    const headers = [
      'MachineID', 'LastNotified', 'NotificationStatus', 
      'LastDataReceived', 'NotificationCount', 'FirstLostTime'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダー装飾
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#666666");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");
    
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  
  return sheet;
}

/**
 * 監視状態の読み込み
 */
function getMonitorStatus(spreadsheet) {
  const sheet = getOrCreateMonitorSheet(spreadsheet);
  const lastRow = sheet.getLastRow();
  const status = {};
  
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    data.forEach(row => {
      if (row[0]) {
        status[row[0]] = {
          lastNotified: row[1],
          status: row[2],
          lastDataReceived: row[3],
          notificationCount: row[4] || 0,
          firstLostTime: row[5]
        };
      }
    });
  }
  
  return status;
}

/**
 * 監視状態の更新
 */
function updateMonitorStatus(spreadsheet, status) {
  const sheet = getOrCreateMonitorSheet(spreadsheet);
  
  // 既存データをクリア
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  // 新規データを書き込み
  const data = [];
  Object.keys(status).forEach(machineId => {
    const s = status[machineId];
    data.push([
      machineId,
      s.lastNotified,
      s.status,
      s.lastDataReceived,
      s.notificationCount || 0,
      s.firstLostTime
    ]);
  });
  
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, 6).setValues(data);
  }
}
```

## 3. トリガー設定

### 3.1 時間主導型トリガー
```javascript
function setupTriggers() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkMachineSignals') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 新規トリガーを設定（1分毎）
  ScriptApp.newTrigger('checkMachineSignals')
    .timeBased()
    .everyMinutes(CONFIG.CHECK_INTERVAL_MINUTES)
    .create();
}
```

### 3.2 初期設定関数
```javascript
function initialSetup() {
  // スクリプトプロパティの設定
  const properties = {
    'DISCORD_WEBHOOK_URL': '', // 要設定
    'TIMEOUT_MINUTES': '10',
    'CHECK_INTERVAL_MINUTES': '1',
    'REMINDER_INTERVAL_MINUTES': '10',
    'ENABLE_NOTIFICATIONS': 'true'
  };
  
  Object.keys(properties).forEach(key => {
    if (!getScriptProperty(key)) {
      setScriptProperty(key, properties[key]);
    }
  });
  
  // トリガーの設定
  setupTriggers();
  
  // 監視状態シートの作成
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateMonitorSheet(spreadsheet);
}
```

## 4. エラーハンドリング

### 4.1 エラー種別と対応
- **WebHook送信エラー**: 3回まで自動リトライ
- **スプレッドシート読み取りエラー**: エラーログに記録して次の機体を処理
- **タイムアウトエラー**: Google Apps Scriptの6分制限に配慮した処理

### 4.2 ログ管理
```javascript
function logError(context, error) {
  console.error(`[${context}] ${error.toString()}`);
  
  // Record error to log sheet (optional)
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = spreadsheet.getSheetByName('_ErrorLog');
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet('_ErrorLog');
      logSheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Context', 'Error']]);
    }
    
    logSheet.appendRow([
      new Date(),
      context,
      error.toString()
    ]);
  } catch (logError) {
    console.error('Error logging failed:', logError);
  }
}
```

## 5. セキュリティ考慮事項

### 5.1 WebHook URL保護
- スクリプトプロパティに保存（コード内にハードコーディングしない）
- 環境変数的な扱いでアクセス制限

### 5.2 権限管理
- 機体のアクティブ状態変更は手動のみ
- WebHook URL変更は管理者のみ

## 6. パフォーマンス最適化

### 6.1 処理効率化
- アクティブな機体のみを監視対象とすることで処理量削減
- バッチ処理で複数機体を効率的に処理

### 6.2 実行時間対策
```javascript
function checkMachineSignalsWithTimeout() {
  const startTime = new Date();
  const MAX_EXECUTION_TIME = 5 * 60 * 1000; // 5 minutes (safety margin for 6-minute limit)
  
  // Processing...
  
  // Check execution time
  if (new Date() - startTime > MAX_EXECUTION_TIME) {
    console.log('Approaching execution time limit, terminating process');
    return;
  }
}
```

## 7. テスト計画

### 7.1 単体テスト
```javascript
function testDiscordNotification() {
  const testMachine = {
    machineId: 'TEST001',
    lastDataTime: new Date(Date.now() - 11 * 60 * 1000), // 11 minutes ago
    lastData: [
      new Date(), '2025/07/24 10:00:00', 'TEST001', 'TEST',
      35.681236, 139.767125, 100, 12, 3.7, 'Test notification'
    ]
  };
  
  sendLostNotification(testMachine);
}

function testMachineMonitoring() {
  // Execute timeout check for specific machine
  checkMachineSignals();
}
```

### 7.2 統合テスト
- 実際の機体データでのタイムアウト検出テスト
- Discord通知の送受信確認
- 復帰通知のテスト

## 8. 運用手順

### 8.1 初期設定
1. Google Apps Scriptプロジェクトで複数ファイルを作成
2. 各ファイルにコードをコピー
3. スクリプトプロパティにDiscord WebHook URLを設定
4. `initialSetup()`を実行
5. 既存の機体シートのK列にアクティブフラグを設定

### 8.2 日常運用
- 機体のアクティブ/非アクティブの切り替えは各シートのK列で実施
- 通知履歴は`_MachineMonitorStatus`シートで確認
- エラーは`_ErrorLog`シートで確認

### 8.3 トラブルシューティング
- 通知が来ない場合：
  1. スクリプトプロパティのWebHook URL確認
  2. トリガーの実行状況確認
  3. エラーログ確認
- 重複通知の場合：
  1. `_MachineMonitorStatus`シートの状態確認
  2. 必要に応じて状態をリセット