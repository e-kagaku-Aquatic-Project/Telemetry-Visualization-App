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

  // ヘッダー行を設定
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
  ];

  // ヘッダーを設定
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー行の書式設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");

  // 列幅を自動調整
  sheet.autoResizeColumns(1, headers.length);

  // フリーズヘッダー
  sheet.setFrozenRows(1);

  Logger.log(`New sheet created: ${sheetName}`);

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
