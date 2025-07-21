// GAS用スクリプトv2.0.0
// Made by Shintaro Matsumoto

// WebAppのメインエントリーポイント
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case "getAllMachines":
        return getAllMachinesData();

      case "getMachine":
        const machineId = e.parameter.machineId;
        if (!machineId) {
          throw new Error("Machine ID is required");
        }
        return getMachineData(machineId);

      case "getMachineList":
        return getMachineList();

      default:
        return createErrorResponse("Invalid action");
    }
  } catch (error) {
    Logger.log("doGet Error: " + error.toString());
    return createErrorResponse(error.toString());
  }
}

function doPost(e) {
  try {
    // POSTデータを取得
    const data = JSON.parse(e.postData.contents);

    // アクションタイプを確認
    if (data.action === "registerMachine") {
      // 機体登録処理
      const result = registerMachine(data);
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      // 通常のデータ保存処理
      const result = saveToSpreadsheet(data);

      // レスポンスを返す
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          message: "Data saved successfully",
          rowNumber: result.row,
          sheetName: result.sheetName,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log("Error: " + error.toString());

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveToSpreadsheet(data) {
  try {
    // スプレッドシートから開いた場合はgetActiveSpreadsheet()を使用
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const machineId = data.MachineID;

    // MachineIDに基づいてシート名を決定
    const sheetName = `Machine_${machineId}`;

    // シートを取得または作成
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = createNewSheet(spreadsheet, sheetName);
    }

    // GAS側のタイムスタンプを取得（Machine Timeと同じ形式）
    const gasTimestamp = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd H:mm:ss");
    
    // データを行に変換
    const rowData = [
      gasTimestamp,      // GAS Time (YYYY/MM/DD H:MM:SS)
      data.MachineTime,  // Machine Time
      data.MachineID,
      data.DataType,
      data.GPS.LAT,
      data.GPS.LNG,
      data.GPS.ALT,
      data.GPS.SAT,
      data.BAT,
      data.CMT,
    ];

    // データを追加
    sheet.appendRow(rowData);

    // 列幅を自動調整
    sheet.autoResizeColumns(1, 10);

    // 追加した行番号を取得
    const lastRow = sheet.getLastRow();

    Logger.log(`Data saved to sheet: ${sheetName}, row: ${lastRow}`);

    return {
      sheetName: sheetName,
      row: lastRow,
    };
  } catch (error) {
    Logger.log("Error in saveToSpreadsheet: " + error.toString());
    throw error;
  }
}

function createNewSheet(spreadsheet, sheetName) {
  // 新しいシートを作成
  const sheet = spreadsheet.insertSheet(sheetName);

  // ヘッダー行を設定（K列に運用状況を追加）
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
    "Operational Status"  // New column K
  ];

  // ヘッダーを設定
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー行の書式設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");

  // K列（運用状況）の特別な設定
  const statusCell = sheet.getRange(1, 11); // K1
  
  // データ検証を設定（ドロップダウンリスト）
  const validationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Inactive', 'Maintenance'], true)
    .setAllowInvalid(false)
    .setHelpText('Select operational status for monitoring')
    .build();
  
  statusCell.setDataValidation(validationRule);
  statusCell.setValue('Inactive'); // デフォルト値
  
  // 運用状況セルの特別なフォーマット
  statusCell.setBackground("#f8f9fa");
  statusCell.setFontColor("#333333");
  statusCell.setHorizontalAlignment("center");
  statusCell.setFontWeight("bold");

  // 列幅を自動調整
  sheet.autoResizeColumns(1, headers.length);

  // フリーズヘッダー
  sheet.setFrozenRows(1);

  Logger.log(`New sheet created with monitoring support: ${sheetName}`);

  return sheet;
}

/**
 * 機体登録機能
 * シートのみ作成し、データは保存しない
 */
function registerMachine(data) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const machineId = data.MachineID;
    
    if (!machineId) {
      return {
        status: "error",
        message: "MachineID is required"
      };
    }
    
    // MachineIDに基づいてシート名を決定
    const sheetName = `Machine_${machineId}`;
    
    // 既存のシートをチェック
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      return {
        status: "error",
        message: `Machine ${machineId} already exists`,
        sheetName: sheetName
      };
    }
    
    // 新しいシートを作成
    sheet = createNewSheet(spreadsheet, sheetName);
    
    // メタデータ情報を記録（オプション）
    if (data.metadata) {
      // メタデータ行を追加（コメント欄に記録）
      const metadataRow = [
        Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd H:mm:ss"),  // GAS Time
        Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd H:mm:ss"),  // Machine Time
        machineId,
        "REGISTRATION",
        0, // Latitude
        0, // Longitude
        0, // Altitude
        0, // Satellites
        0, // Battery
        JSON.stringify(data.metadata)
      ];
      sheet.appendRow(metadataRow);
    }
    
    return {
      status: "success",
      message: `Machine ${machineId} registered successfully`,
      sheetName: sheetName,
      machineId: machineId,
      registeredAt: new Date().toISOString()
    };
    
  } catch (error) {
    Logger.log("Error in registerMachine: " + error.toString());
    return {
      status: "error",
      message: error.toString()
    };
  }
}

// === WebApp API Functions ===

/**
 * 全機体データを取得
 */
function getAllMachinesData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const machines = [];

    // 各シートを処理（Machine_で始まるシートのみ）
    sheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      if (sheetName.startsWith("Machine_")) {
        const machineId = sheetName.replace("Machine_", "");
        const machineData = getMachineDataFromSheet(sheet);

        if (machineData.length > 0) {
          machines.push({
            machineId: machineId,
            data: machineData,
          });
        }
      }
    });

    return createSuccessResponse({
      machines: machines,
      totalMachines: machines.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.log("getAllMachinesData Error: " + error.toString());
    return createErrorResponse(error.toString());
  }
}

/**
 * 特定機体のデータを取得
 */
function getMachineData(machineId) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = `Machine_${machineId}`;
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`Machine ${machineId} not found`);
    }

    const machineData = getMachineDataFromSheet(sheet);

    return createSuccessResponse({
      machineId: machineId,
      data: machineData,
      dataCount: machineData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.log("getMachineData Error: " + error.toString());
    return createErrorResponse(error.toString());
  }
}

/**
 * 機体リストを取得
 */
function getMachineList() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const machineList = [];

    sheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      if (sheetName.startsWith("Machine_")) {
        const machineId = sheetName.replace("Machine_", "");
        const lastRow = sheet.getLastRow();
        const dataCount = lastRow > 1 ? lastRow - 1 : 0; // ヘッダー行を除く

        machineList.push({
          machineId: machineId,
          sheetName: sheetName,
          dataCount: dataCount,
          lastUpdate: dataCount > 0 ? getLastUpdateTime(sheet) : null,
        });
      }
    });

    return createSuccessResponse({
      machines: machineList,
      totalMachines: machineList.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Logger.log("getMachineList Error: " + error.toString());
    return createErrorResponse(error.toString());
  }
}

/**
 * シートから機体データを取得
 */
function getMachineDataFromSheet(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return []; // ヘッダーのみまたは空のシート
    }

    // データ範囲を取得（ヘッダー行を除く）
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 10); // 10列分のデータ（GAS Time列を追加）
    const values = dataRange.getValues();

    const machineData = [];

    values.forEach((row) => {
      // 空の行をスキップ
      if (row[0] && row[1]) {
        const dataPoint = {
          timestamp: formatTimestamp(row[0]),  // GAS Time (文字列のまま使用)
          machineTime: row[1],                 // Machine Time
          machineId: row[2],                   // vehicleId -> machineId
          dataType: row[3] || "",
          latitude: parseFloat(row[4]) || 0,
          longitude: parseFloat(row[5]) || 0,
          altitude: parseFloat(row[6]) || 0,
          satellites: parseInt(row[7]) || 0,
          battery: parseFloat(row[8]) || 0,
          comment: row[9] || "",
        };

        machineData.push(dataPoint);
      }
    });

    // 時系列でソート
    machineData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return machineData;
  } catch (error) {
    Logger.log("getMachineDataFromSheet Error: " + error.toString());
    throw error;
  }
}

/**
 * 最終更新時刻を取得
 */
function getLastUpdateTime(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return null;
    }

    const timestampCell = sheet.getRange(lastRow, 1);
    const timestamp = timestampCell.getValue();

    return formatTimestamp(timestamp);
  } catch (error) {
    Logger.log("getLastUpdateTime Error: " + error.toString());
    return null;
  }
}

/**
 * 最終更新地点を取得
 * @param {Sheet} sheet - シートオブジェクト
 * @returns {Object|null} 緯度経度情報
 */
function getLastLocation(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return null;
    }

    // 最終行から緯度経度を取得（E列=緯度、F列=経度）
    const locationRange = sheet.getRange(lastRow, 5, 1, 2);  // E:F列
    const locationValues = locationRange.getValues()[0];
    
    const latitude = parseFloat(locationValues[0]) || 0;
    const longitude = parseFloat(locationValues[1]) || 0;
    
    if (latitude === 0 && longitude === 0) {
      return null;
    }
    
    return {
      latitude: latitude,
      longitude: longitude
    };
  } catch (error) {
    Logger.log("getLastLocation Error: " + error.toString());
    return null;
  }
}

/**
 * タイムスタンプのフォーマット
 */
function formatTimestamp(timestamp) {
  try {
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    } else if (typeof timestamp === "string") {
      // 既にISO形式の場合はそのまま返す
      if (timestamp.includes("T") && timestamp.includes("Z")) {
        return timestamp;
      }
      // 日付文字列の場合はDateオブジェクトに変換
      const date = new Date(timestamp);
      return date.toISOString();
    } else {
      // その他の場合は現在時刻を返す
      return new Date().toISOString();
    }
  } catch (error) {
    Logger.log("formatTimestamp Error: " + error.toString());
    return new Date().toISOString();
  }
}

/**
 * 成功レスポンスを作成
 */
function createSuccessResponse(data) {
  const response = {
    status: "success",
    ...data,
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * エラーレスポンスを作成
 */
function createErrorResponse(message) {
  const response = {
    status: "error",
    message: message,
    timestamp: new Date().toISOString(),
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// === Test Functions ===

/**
 * テスト用関数（手動実行用）
 */
function testFunction() {
  const testData = {
    DataType: "HK",
    MachineID: "00453",
    MachineTime: "2025/07/16 00:41:41",
    GPS: {
      LAT: 34.124125,
      LNG: 153.131241,
      ALT: 342.5,
      SAT: 43,
    },
    BAT: 3.45,
    CMT: "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE",
  };

  const result = saveToSpreadsheet(testData);
  Logger.log("Test result: " + JSON.stringify(result));
}

/**
 * WebApp APIのテスト用関数
 */
function testWebAppAPI() {
  try {
    console.log("=== WebApp API Test ===");

    // 全機体データ取得のテスト
    console.log("Testing getAllMachinesData...");
    const allMachinesResult = getAllMachinesData();
    const allMachinesData = JSON.parse(allMachinesResult.getContent());
    console.log("All machines result:", allMachinesData);

    // 機体リスト取得のテスト
    console.log("Testing getMachineList...");
    const machineListResult = getMachineList();
    const machineListData = JSON.parse(machineListResult.getContent());
    console.log("Machine list result:", machineListData);

    // 特定機体データ取得のテスト
    if (
      allMachinesData.status === "success" &&
      allMachinesData.machines.length > 0
    ) {
      const firstMachineId = allMachinesData.machines[0].machineId;
      console.log(`Testing getMachineData for ${firstMachineId}...`);
      const machineResult = getMachineData(firstMachineId);
      const machineData = JSON.parse(machineResult.getContent());
      console.log("Single machine result:", machineData);
    }

    console.log("=== Test Completed ===");
  } catch (error) {
    console.error("Test Error:", error.toString());
  }
}

// === Discord Monitoring System ===

/**
 * Configuration Management Functions
 */

/**
 * Set Discord webhook URL (deprecated - now hardcoded)
 * @deprecated URL is now hardcoded in getDiscordWebhookUrl() function
 * @param {string} url - Discord webhook URL
 */
function setDiscordWebhookUrl(url) {
  Logger.log('Note: Discord webhook URL is now hardcoded in the getDiscordWebhookUrl() function.');
  Logger.log('Please edit the DISCORD_WEBHOOK_URL constant in getDiscordWebhookUrl() function instead.');
}

/**
 * Get Discord webhook URL
 * @returns {string|null} Webhook URL or null if not configured
 */
function getDiscordWebhookUrl() {
  // Discord Webhook URLを直接指定してください
  const DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL_HERE";
  
  // URLが設定されていない場合は警告
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
    Logger.log("Warning: Discord webhook URL not configured");
    return null;
  }
  
  return DISCORD_WEBHOOK_URL;
}

/**
 * Enable or disable monitoring
 * @param {boolean} enabled - Monitoring state
 */
function setMonitoringEnabled(enabled) {
  PropertiesService.getScriptProperties().setProperty('MONITORING_ENABLED', enabled.toString());
  Logger.log(`Monitoring ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if monitoring is enabled
 * @returns {boolean} Monitoring state
 */
function isMonitoringEnabled() {
  const enabled = PropertiesService.getScriptProperties().getProperty('MONITORING_ENABLED');
  return enabled === 'true';
}

/**
 * Set alert threshold in minutes
 * @param {number} minutes - Threshold in minutes
 */
function setAlertThresholdMinutes(minutes) {
  if (minutes < 1 || minutes > 1440) { // 1 minute to 24 hours
    throw new Error('Alert threshold must be between 1 and 1440 minutes');
  }
  
  PropertiesService.getScriptProperties().setProperty('ALERT_THRESHOLD_MINUTES', minutes.toString());
  Logger.log(`Alert threshold set to ${minutes} minutes`);
}

/**
 * Get alert threshold in minutes
 * @returns {number} Threshold in minutes (default: 10)
 */
function getAlertThresholdMinutes() {
  const threshold = PropertiesService.getScriptProperties().getProperty('ALERT_THRESHOLD_MINUTES');
  return threshold ? parseInt(threshold) : 10;
}

/**
 * Get cooldown period in hours
 * @returns {number} Cooldown hours (default: 24)
 */
function getCooldownHours() {
  const hours = PropertiesService.getScriptProperties().getProperty('ALERT_COOLDOWN_HOURS');
  return hours ? parseInt(hours) : 24;
}

/**
 * Set cooldown period in hours
 * @param {number} hours - Cooldown period in hours
 */
function setCooldownHours(hours) {
  if (hours < 1 || hours > 168) { // 1 hour to 7 days
    throw new Error('Cooldown period must be between 1 and 168 hours');
  }
  
  PropertiesService.getScriptProperties().setProperty('ALERT_COOLDOWN_HOURS', hours.toString());
  Logger.log(`Cooldown period set to ${hours} hours`);
}

/**
 * Alert History Management Functions
 */

/**
 * Get alert history from PropertiesService
 * @returns {Array<Object>} Alert history records
 */
function getAlertHistory() {
  try {
    const historyJson = PropertiesService.getScriptProperties().getProperty('ALERT_HISTORY');
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    Logger.log(`Error reading alert history: ${error.toString()}`);
    return [];
  }
}

/**
 * Save alert history to PropertiesService
 * @param {Array<Object>} history - Alert history records
 */
function saveAlertHistory(history) {
  try {
    // Limit history size to prevent storage overflow
    const maxRecords = 1000;
    if (history.length > maxRecords) {
      history = history.slice(-maxRecords); // Keep only the most recent records
    }
    
    const historyJson = JSON.stringify(history);
    PropertiesService.getScriptProperties().setProperty('ALERT_HISTORY', historyJson);
  } catch (error) {
    Logger.log(`Error saving alert history: ${error.toString()}`);
  }
}

/**
 * Update alert record for a specific machine
 * @param {string} machineId - Machine ID
 * @param {Object} updates - Update object
 */
function updateMachineAlertRecord(machineId, updates) {
  const history = getAlertHistory();
  const existingIndex = history.findIndex(record => record.machineId === machineId);
  
  if (existingIndex >= 0) {
    // Update existing record
    history[existingIndex] = { ...history[existingIndex], ...updates };
  } else {
    // Create new record
    history.push({
      machineId: machineId,
      isCurrentlyAlerting: false,
      alertCount: 0,
      ...updates
    });
  }
  
  saveAlertHistory(history);
}

/**
 * Clear all alert history (maintenance function)
 */
function clearAlertHistory() {
  PropertiesService.getScriptProperties().deleteProperty('ALERT_HISTORY');
  Logger.log('Alert history cleared');
}

/**
 * Check if machine is in cooldown period
 * @param {string} lastAlertTime - ISO timestamp of last alert
 * @returns {boolean} True if in cooldown period
 */
function isInCooldownPeriod(lastAlertTime) {
  if (!lastAlertTime) return false;
  
  const cooldownHours = getCooldownHours();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const lastAlert = new Date(lastAlertTime);
  const currentTime = new Date();
  
  return (currentTime - lastAlert) < cooldownMs;
}

/**
 * Update alert history after monitoring cycle
 * @param {Array<Object>} staleMachines - Array of stale machines
 * @param {Array<Object>} recoveredMachines - Array of recovered machines
 */
function updateAlertHistory(staleMachines, recoveredMachines) {
  try {
    // Store last monitoring execution time
    PropertiesService.getScriptProperties().setProperty('LAST_MONITORING_EXECUTION', new Date().toISOString());
    
    Logger.log(`Alert history updated: ${staleMachines.length} stale, ${recoveredMachines.length} recovered`);
  } catch (error) {
    Logger.log(`Error updating alert history: ${error.toString()}`);
  }
}

/**
 * Discord Integration Functions
 */

/**
 * Send stale machine alert to Discord
 * @param {Object} details - Alert details
 * @returns {boolean} Success status
 */
function sendStaleAlert(details) {
  const embed = createStaleAlertEmbed(details);
  return sendDiscordNotification(embed);
}

/**
 * Send recovery notification to Discord
 * @param {Object} details - Recovery details  
 * @returns {boolean} Success status
 */
function sendRecoveryAlert(details) {
  const embed = createRecoveryEmbed(details);
  return sendDiscordNotification(embed);
}

/**
 * Send notification to Discord via webhook
 * @param {Object} embed - Discord embed object
 * @returns {boolean} Success status
 */
function sendDiscordNotification(embed) {
  try {
    const webhookUrl = getDiscordWebhookUrl();
    if (!webhookUrl) {
      Logger.log("Discord webhook URL not configured");
      return false;
    }
    
    const payload = {
      embeds: [embed]
    };
    
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    
    if (responseCode === 204) {
      Logger.log("Discord notification sent successfully");
      return true;
    } else {
      Logger.log(`Discord notification failed: HTTP ${responseCode} - ${response.getContentText()}`);
      return false;
    }
    
  } catch (error) {
    Logger.log(`Discord notification error: ${error.toString()}`);
    return false;
  }
}

/**
 * Create Discord embed for stale machine alert
 * @param {Object} details - Alert details
 * @returns {Object} Discord embed object
 */
function createStaleAlertEmbed(details) {
  const fields = [
    {
      name: "Machine ID",
      value: details.machineId,
      inline: true
    },
    {
      name: "Last Update",
      value: details.lastUpdate,
      inline: true
    },
    {
      name: "Offline Duration", 
      value: details.offlineDuration,
      inline: true
    }
  ];
  
  // 地点情報があれば追加
  if (details.lastLocation) {
    const googleMapsUrl = `https://www.google.com/maps?q=${details.lastLocation.latitude},${details.lastLocation.longitude}`;
    fields.push({
      name: "Last Known Location",
      value: `${details.lastLocation.latitude.toFixed(6)}, ${details.lastLocation.longitude.toFixed(6)}\n[View on Google Maps](${googleMapsUrl})`,
      inline: false
    });
  }
  
  return {
    title: "🚨 Machine Alert",
    description: "Machine has stopped transmitting data",
    color: 16711680, // Red
    fields: fields,
    timestamp: details.alertTime,
    footer: {
      text: "Machine Telemetry Monitor"
    }
  };
}

/**
 * Create Discord embed for machine recovery
 * @param {Object} details - Recovery details
 * @returns {Object} Discord embed object
 */
function createRecoveryEmbed(details) {
  const fields = [
    {
      name: "Machine ID",
      value: details.machineId,
      inline: true
    },
    {
      name: "Resumed At",
      value: details.resumedAt,
      inline: true
    },
    {
      name: "Offline Duration",
      value: details.offlineDuration,
      inline: true
    }
  ];
  
  // 現在地点情報があれば追加
  if (details.currentLocation) {
    const googleMapsUrl = `https://www.google.com/maps?q=${details.currentLocation.latitude},${details.currentLocation.longitude}`;
    fields.push({
      name: "Current Location",
      value: `${details.currentLocation.latitude.toFixed(6)}, ${details.currentLocation.longitude.toFixed(6)}\n[View on Google Maps](${googleMapsUrl})`,
      inline: false
    });
  }
  
  return {
    title: "✅ Machine Recovery",
    description: "Machine has resumed data transmission", 
    color: 65280, // Green
    fields: fields,
    timestamp: details.recoveryTime,
    footer: {
      text: "Machine Telemetry Monitor"
    }
  };
}

/**
 * Test Discord notification functionality
 * @returns {boolean} Test success status
 */
function testDiscordNotification() {
  try {
    const testEmbed = {
      title: "🧪 Test Notification",
      description: "This is a test notification from the monitoring system",
      color: 3447003, // Blue
      fields: [
        {
          name: "System Status",
          value: "Operational", 
          inline: true
        },
        {
          name: "Test Time",
          value: formatTimestampForDisplay(new Date().toISOString()),
          inline: true
        },
        {
          name: "Test Location",
          value: "35.681236, 139.767125\n[View on Google Maps](https://www.google.com/maps?q=35.681236,139.767125)",
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Machine Telemetry Monitor - Test"
      }
    };
    
    const success = sendDiscordNotification(testEmbed);
    
    if (success) {
      Logger.log("Discord test notification sent successfully");
    } else {
      Logger.log("Discord test notification failed");
    }
    
    return success;
  } catch (error) {
    Logger.log(`Discord test error: ${error.toString()}`);
    return false;
  }
}

/**
 * Monitoring System Core Functions
 */

/**
 * Main monitoring execution function (called by trigger)
 * Orchestrates the complete monitoring cycle
 */
function executeMonitoring() {
  try {
    Logger.log("Starting monitoring cycle");
    
    // Check if monitoring is enabled
    if (!isMonitoringEnabled()) {
      Logger.log("Monitoring disabled, skipping cycle");
      return;
    }
    
    // Get current monitoring state
    const staleMachines = identifyStaleMachines();
    const recoveredMachines = identifyRecoveredMachines();
    
    Logger.log(`Found ${staleMachines.length} stale machines, ${recoveredMachines.length} recovered machines`);
    
    // Process alerts for stale machines
    staleMachines.forEach(machine => {
      processStaleMachineAlert(machine);
    });
    
    // Process recovery notifications
    recoveredMachines.forEach(machine => {
      processRecoveryAlert(machine);
    });
    
    // Update alert history
    updateAlertHistory(staleMachines, recoveredMachines);
    
    Logger.log("Monitoring cycle completed successfully");
    
  } catch (error) {
    Logger.log(`Monitoring error: ${error.toString()}`);
    // Don't re-throw to prevent trigger deletion
  }
}

/**
 * Get all machines with operational status "Active"
 * @returns {Array<Object>} Array of active machine objects
 */
function getAllActiveMachines() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  const activeMachines = [];
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (!sheetName.startsWith("Machine_")) return;
    
    try {
      // Check operational status in K1
      const statusValue = sheet.getRange(1, 11).getValue();
      if (statusValue !== "Active") return;
      
      const machineId = sheetName.replace("Machine_", "");
      const lastUpdate = getLastUpdateTime(sheet);
      const lastLocation = getLastLocation(sheet);
      
      if (lastUpdate) {
        activeMachines.push({
          machineId: machineId,
          sheetName: sheetName,
          lastUpdate: lastUpdate,
          lastLocation: lastLocation,
          status: statusValue
        });
      }
    } catch (error) {
      Logger.log(`Error processing sheet ${sheetName}: ${error.toString()}`);
    }
  });
  
  return activeMachines;
}

/**
 * Identify machines that are active but have stale data
 * @returns {Array<Object>} Array of stale machine objects
 */
function identifyStaleMachines() {
  const activeMachines = getAllActiveMachines();
  const currentTime = new Date();
  const thresholdMinutes = getAlertThresholdMinutes();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return activeMachines.filter(machine => {
    if (!machine.lastUpdate) return false;
    
    const lastUpdateTime = new Date(machine.lastUpdate);
    const elapsedMs = currentTime - lastUpdateTime;
    
    return elapsedMs > thresholdMs;
  });
}

/**
 * Identify machines that have recovered from stale state
 * @returns {Array<Object>} Array of recovered machine objects
 */
function identifyRecoveredMachines() {
  const alertHistory = getAlertHistory();
  const currentlyAlertingMachines = alertHistory.filter(record => record.isCurrentlyAlerting);
  
  if (currentlyAlertingMachines.length === 0) {
    return [];
  }
  
  const activeMachines = getAllActiveMachines();
  const thresholdMinutes = getAlertThresholdMinutes();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const currentTime = new Date();
  
  return currentlyAlertingMachines.filter(alertRecord => {
    const activeMachine = activeMachines.find(m => m.machineId === alertRecord.machineId);
    
    if (!activeMachine) return false; // Machine no longer active
    
    const lastUpdateTime = new Date(activeMachine.lastUpdate);
    const elapsedMs = currentTime - lastUpdateTime;
    
    // Machine is considered recovered if it's within threshold
    return elapsedMs <= thresholdMs;
  }).map(alertRecord => {
    const activeMachine = activeMachines.find(m => m.machineId === alertRecord.machineId);
    return {
      ...activeMachine,
      previousAlertTime: alertRecord.lastAlertTime,
      offlineDuration: calculateOfflineDuration(alertRecord.lastAlertTime, activeMachine.lastUpdate)
    };
  });
}

/**
 * Process alert for a stale machine
 * @param {Object} machine - Stale machine object
 */
function processStaleMachineAlert(machine) {
  try {
    const alertHistory = getAlertHistory();
    const existingRecord = alertHistory.find(record => record.machineId === machine.machineId);
    
    // Check cooldown period
    if (existingRecord && isInCooldownPeriod(existingRecord.lastAlertTime)) {
      Logger.log(`Machine ${machine.machineId} still in cooldown period`);
      return;
    }
    
    // Calculate offline duration
    const currentTime = new Date();
    const lastUpdateTime = new Date(machine.lastUpdate);
    const offlineDurationMs = currentTime - lastUpdateTime;
    const offlineDurationText = formatDuration(offlineDurationMs);
    
    // Send Discord notification
    const alertDetails = {
      machineId: machine.machineId,
      lastUpdate: formatTimestampForDisplay(machine.lastUpdate),
      offlineDuration: offlineDurationText,
      alertTime: currentTime.toISOString(),
      lastLocation: machine.lastLocation
    };
    
    const notificationSent = sendStaleAlert(alertDetails);
    
    if (notificationSent) {
      Logger.log(`Stale alert sent for machine ${machine.machineId}`);
      
      // Update alert history
      updateMachineAlertRecord(machine.machineId, {
        lastAlertTime: currentTime.toISOString(),
        isCurrentlyAlerting: true,
        alertCount: (existingRecord?.alertCount || 0) + 1,
        lastUpdateTime: machine.lastUpdate
      });
    } else {
      Logger.log(`Failed to send stale alert for machine ${machine.machineId}`);
    }
    
  } catch (error) {
    Logger.log(`Error processing stale alert for ${machine.machineId}: ${error.toString()}`);
  }
}

/**
 * Process recovery alert for a recovered machine
 * @param {Object} machine - Recovered machine object
 */
function processRecoveryAlert(machine) {
  try {
    const recoveryDetails = {
      machineId: machine.machineId,
      resumedAt: formatTimestampForDisplay(machine.lastUpdate),
      offlineDuration: machine.offlineDuration,
      recoveryTime: new Date().toISOString(),
      currentLocation: machine.lastLocation
    };
    
    const notificationSent = sendRecoveryAlert(recoveryDetails);
    
    if (notificationSent) {
      Logger.log(`Recovery alert sent for machine ${machine.machineId}`);
      
      // Update alert history
      updateMachineAlertRecord(machine.machineId, {
        isCurrentlyAlerting: false,
        lastRecoveryTime: new Date().toISOString(),
        lastUpdateTime: machine.lastUpdate
      });
    } else {
      Logger.log(`Failed to send recovery alert for machine ${machine.machineId}`);
    }
    
  } catch (error) {
    Logger.log(`Error processing recovery alert for ${machine.machineId}: ${error.toString()}`);
  }
}

/**
 * Utility Functions
 */

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} durationMs - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(durationMs) {
  const minutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours % 24} hour${(hours % 24) > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes % 60} minute${(minutes % 60) > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

/**
 * Calculate offline duration between two timestamps
 * @param {string} alertTime - Alert timestamp
 * @param {string} recoveryTime - Recovery timestamp  
 * @returns {string} Formatted offline duration
 */
function calculateOfflineDuration(alertTime, recoveryTime) {
  const alertDate = new Date(alertTime);
  const recoveryDate = new Date(recoveryTime);
  const durationMs = Math.abs(recoveryDate - alertDate);
  
  return formatDuration(durationMs);
}

/**
 * Format timestamp for display in notifications
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted timestamp
 */
function formatTimestampForDisplay(timestamp) {
  try {
    const date = new Date(timestamp);
    return Utilities.formatDate(date, "Asia/Tokyo", "yyyy-MM-dd HH:mm:ss");
  } catch (error) {
    Logger.log(`Error formatting timestamp: ${error.toString()}`);
    return timestamp;
  }
}

/**
 * Trigger Management Functions
 */

/**
 * Install monitoring trigger (5-minute intervals)
 */
function installMonitoringTrigger() {
  try {
    // Delete existing monitoring triggers first
    deleteMonitoringTrigger();
    
    // Create new trigger
    ScriptApp.newTrigger('executeMonitoring')
      .timeBased()
      .everyMinutes(5)
      .create();
      
    Logger.log('Monitoring trigger installed successfully (5-minute intervals)');
  } catch (error) {
    Logger.log(`Error installing monitoring trigger: ${error.toString()}`);
    throw error;
  }
}

/**
 * Delete all monitoring triggers
 */
function deleteMonitoringTrigger() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let deletedCount = 0;
    
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'executeMonitoring') {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
      }
    });
    
    Logger.log(`Deleted ${deletedCount} monitoring trigger(s)`);
  } catch (error) {
    Logger.log(`Error deleting monitoring triggers: ${error.toString()}`);
  }
}

/**
 * Check if monitoring trigger is installed
 * @returns {boolean} True if trigger exists
 */
function isMonitoringTriggerInstalled() {
  const triggers = ScriptApp.getProjectTriggers();
  return triggers.some(trigger => trigger.getHandlerFunction() === 'executeMonitoring');
}

/**
 * System Management and Testing Functions
 */

/**
 * Get comprehensive monitoring system status
 * @returns {Object} System status object
 */
function getMonitoringSystemStatus() {
  const webhookUrl = getDiscordWebhookUrl();
  return {
    webhookConfigured: !!webhookUrl,
    webhookStatus: webhookUrl ? "Configured" : "Not configured (edit getDiscordWebhookUrl function)",
    monitoringEnabled: isMonitoringEnabled(), 
    triggerInstalled: isMonitoringTriggerInstalled(),
    alertThresholdMinutes: getAlertThresholdMinutes(),
    cooldownHours: getCooldownHours(),
    alertHistoryCount: getAlertHistory().length,
    activeMachineCount: getAllActiveMachines().length,
    lastExecutionTime: PropertiesService.getScriptProperties().getProperty('LAST_MONITORING_EXECUTION'),
    systemVersion: "1.0.1"
  };
}

/**
 * Manually execute monitoring cycle (for testing)
 */
function manualMonitoringExecution() {
  Logger.log("=== Manual Monitoring Execution ===");
  
  const startTime = new Date();
  executeMonitoring();
  const endTime = new Date();
  
  Logger.log(`Monitoring execution completed in ${endTime - startTime}ms`);
  Logger.log("=== Manual Monitoring Completed ===");
}

/**
 * Get detailed status of all machines for debugging
 * @returns {Array<Object>} Machine status array
 */
function getAllMachineStatuses() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  const machineStatuses = [];
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (!sheetName.startsWith("Machine_")) return;
    
    try {
      const machineId = sheetName.replace("Machine_", "");
      const statusCell = sheet.getRange(1, 11);
      const operationalStatus = statusCell.getValue() || "Unknown";
      const lastUpdate = getLastUpdateTime(sheet);
      
      const currentTime = new Date();
      const elapsedMinutes = lastUpdate ? 
        Math.floor((currentTime - new Date(lastUpdate)) / (1000 * 60)) : null;
      
      machineStatuses.push({
        machineId: machineId,
        operationalStatus: operationalStatus,
        lastUpdate: lastUpdate,
        elapsedMinutes: elapsedMinutes,
        isStale: operationalStatus === "Active" && elapsedMinutes > getAlertThresholdMinutes(),
        sheetName: sheetName
      });
    } catch (error) {
      Logger.log(`Error getting status for ${sheetName}: ${error.toString()}`);
    }
  });
  
  return machineStatuses;
}

/**
 * Setup monitoring system with default configuration
 */
function setupMonitoringSystem() {
  Logger.log("=== Setting up Discord Monitoring System ===");
  
  try {
    // Set default configurations
    setAlertThresholdMinutes(10);  // 10 minutes threshold
    setCooldownHours(24);          // 24 hours cooldown
    
    Logger.log("Default configurations set:");
    Logger.log("- Alert threshold: 10 minutes");
    Logger.log("- Cooldown period: 24 hours");
    
    const status = getMonitoringSystemStatus();
    Logger.log("System status:", status);
    
    Logger.log("\nNext steps:");
    Logger.log("1. Edit Discord webhook URL in getDiscordWebhookUrl() function");
    Logger.log("2. Enable monitoring: setMonitoringEnabled(true)");
    Logger.log("3. Install trigger: installMonitoringTrigger()");
    Logger.log("4. Set machine status to 'Active' in column K for machines to monitor");
    Logger.log("5. Test notification: testDiscordNotification()");
    
  } catch (error) {
    Logger.log(`Setup error: ${error.toString()}`);
  }
}

/**
 * Complete system initialization (for first-time setup)
 * Note: Make sure to edit the Discord webhook URL in getDiscordWebhookUrl() function first
 */
function initializeMonitoringSystem() {
  try {
    Logger.log("=== Initializing Discord Monitoring System ===");
    
    // Check Discord webhook configuration
    const webhookUrl = getDiscordWebhookUrl();
    if (!webhookUrl) {
      Logger.log("⚠ Please edit the Discord webhook URL in getDiscordWebhookUrl() function first");
      return;
    }
    Logger.log("✓ Discord webhook URL found in code");
    
    // Set default configurations
    setAlertThresholdMinutes(10);
    setCooldownHours(24);
    Logger.log("✓ Default configurations set");
    
    // Enable monitoring
    setMonitoringEnabled(true);
    Logger.log("✓ Monitoring enabled");
    
    // Install trigger
    installMonitoringTrigger();
    Logger.log("✓ Monitoring trigger installed");
    
    // Test Discord notification
    const testResult = testDiscordNotification();
    if (testResult) {
      Logger.log("✓ Discord notification test successful");
    } else {
      Logger.log("⚠ Discord notification test failed - check webhook URL in getDiscordWebhookUrl() function");
    }
    
    // Show final status
    const status = getMonitoringSystemStatus();
    Logger.log("=== Initialization Complete ===");
    Logger.log("System Status:", status);
    
    Logger.log("\nTo monitor machines:");
    Logger.log("1. Open each machine sheet");
    Logger.log("2. Set cell K1 to 'Active' for machines to monitor");
    Logger.log("3. Monitoring will begin automatically every 5 minutes");
    
    return status;
    
  } catch (error) {
    Logger.log(`Initialization error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Test function to simulate monitoring scenarios
 */
function testMonitoringScenarios() {
  Logger.log("=== Testing Monitoring Scenarios ===");
  
  try {
    // Test 1: Get all active machines
    const activeMachines = getAllActiveMachines();
    Logger.log(`Test 1 - Active machines found: ${activeMachines.length}`);
    activeMachines.forEach(machine => {
      Logger.log(`  - Machine ${machine.machineId}: Last update ${machine.lastUpdate}`);
    });
    
    // Test 2: Check for stale machines
    const staleMachines = identifyStaleMachines();
    Logger.log(`Test 2 - Stale machines found: ${staleMachines.length}`);
    staleMachines.forEach(machine => {
      const lastUpdate = new Date(machine.lastUpdate);
      const elapsedMinutes = Math.floor((new Date() - lastUpdate) / (1000 * 60));
      Logger.log(`  - Machine ${machine.machineId}: ${elapsedMinutes} minutes offline`);
    });
    
    // Test 3: Check recovery candidates
    const recoveredMachines = identifyRecoveredMachines();
    Logger.log(`Test 3 - Recovered machines found: ${recoveredMachines.length}`);
    recoveredMachines.forEach(machine => {
      Logger.log(`  - Machine ${machine.machineId}: Recovered`);
    });
    
    // Test 4: Alert history
    const alertHistory = getAlertHistory();
    Logger.log(`Test 4 - Alert history records: ${alertHistory.length}`);
    alertHistory.forEach(record => {
      Logger.log(`  - Machine ${record.machineId}: ${record.isCurrentlyAlerting ? 'Currently alerting' : 'Not alerting'}`);
    });
    
    Logger.log("=== Testing Complete ===");
    
  } catch (error) {
    Logger.log(`Testing error: ${error.toString()}`);
  }
}
