// DataManager.gs - Data Management Functions
// Discord WebHook Notification System v1.0.0

/**
 * Save telemetry data to spreadsheet
 * @param {Object} data - Telemetry data object
 * @returns {Object} Save result
 */
function saveToSpreadsheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const machineId = data.MachineID;

    if (!isValidMachineId(machineId)) {
      throw new Error(`Invalid machine ID: ${machineId}`);
    }

    // Determine sheet name based on MachineID
    const sheetName = `Machine_${machineId}`;

    // Get or create sheet
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = createNewSheet(spreadsheet, sheetName);
    }

    // Get GAS timestamp (same format as Machine Time)
    const gasTimestamp = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd H:mm:ss");
    
    // Convert data to row format
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

    // Add data row
    sheet.appendRow(rowData);

    // Auto-resize columns
    sheet.autoResizeColumns(1, 10);

    // Get added row number
    const lastRow = sheet.getLastRow();

    console.log(`Data saved to sheet: ${sheetName}, row: ${lastRow}`);

    return {
      sheetName: sheetName,
      row: lastRow,
    };
  } catch (error) {
    logError("saveToSpreadsheet", error);
    throw error;
  }
}

/**
 * Create new machine sheet with headers and active status
 * @param {Spreadsheet} spreadsheet - Target spreadsheet
 * @param {string} sheetName - Sheet name to create
 * @returns {Sheet} Created sheet
 */
function createNewSheet(spreadsheet, sheetName) {
  try {
    // Create new sheet
    const sheet = spreadsheet.insertSheet(sheetName);

    // Set headers including IsActive column
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
      "IsActive"  // K column for active status
    ];

    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Header formatting
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#4285f4");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");

    // Set K1 cell (IsActive) default value to TRUE
    sheet.getRange(1, 11).setValue(true);

    // Set K1 cell as checkbox
    const activeColumnRange = sheet.getRange(1, 11);
    activeColumnRange.insertCheckboxes();

    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);

    // Freeze header row
    sheet.setFrozenRows(1);

    console.log(`New sheet created: ${sheetName}`);

    return sheet;
  } catch (error) {
    logError("createNewSheet", error);
    throw error;
  }
}

/**
 * Register machine (create sheet only, no data)
 * @param {Object} data - Registration data
 * @returns {Object} Registration result
 */
function registerMachine(data) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const machineId = data.MachineID;
    
    if (!machineId || !isValidMachineId(machineId)) {
      return {
        status: "error",
        message: "Valid MachineID is required"
      };
    }
    
    // Determine sheet name based on MachineID
    const sheetName = `Machine_${machineId}`;
    
    // Check if sheet already exists
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      return {
        status: "error",
        message: `Machine ${machineId} already exists`,
        sheetName: sheetName
      };
    }
    
    // Create new sheet
    sheet = createNewSheet(spreadsheet, sheetName);
    
    // Record metadata if provided
    if (data.metadata) {
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
    logError("registerMachine", error);
    return {
      status: "error",
      message: error.toString()
    };
  }
}

/**
 * Get all machine data
 * @returns {ContentService.TextOutput} All machine data response
 */
function getAllMachinesData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const machines = [];

    // Process each sheet (only Machine_ prefixed sheets)
    sheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      if (sheetName.startsWith("Machine_")) {
        const machineId = sheetName.replace("Machine_", "");
        const machineData = getMachineDataFromSheet(sheet);

        if (machineData.length > 0) {
          machines.push({
            machineId: machineId,
            data: machineData,
            isActive: getMachineActiveStatus(sheet)
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
    logError("getAllMachinesData", error);
    return createErrorResponse(error.toString());
  }
}

/**
 * Get specific machine data
 * @param {string} machineId - Machine ID
 * @returns {ContentService.TextOutput} Machine data response
 */
function getMachineData(machineId) {
  try {
    if (!isValidMachineId(machineId)) {
      throw new Error(`Invalid machine ID: ${machineId}`);
    }

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
      isActive: getMachineActiveStatus(sheet),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("getMachineData", error);
    return createErrorResponse(error.toString());
  }
}

/**
 * Get machine list
 * @returns {ContentService.TextOutput} Machine list response
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
        const dataCount = lastRow > 1 ? lastRow - 1 : 0; // Exclude header row

        machineList.push({
          machineId: machineId,
          sheetName: sheetName,
          dataCount: dataCount,
          isActive: getMachineActiveStatus(sheet),
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
    logError("getMachineList", error);
    return createErrorResponse(error.toString());
  }
}

/**
 * Get machine data from specific sheet
 * @param {Sheet} sheet - Target sheet
 * @returns {Array} Machine data array
 */
function getMachineDataFromSheet(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return []; // Header only or empty sheet
    }

    // Get data range (excluding header row)
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 10); // 10 columns of data
    const values = dataRange.getValues();

    const machineData = [];

    values.forEach((row) => {
      // Skip empty rows
      if (row[0] && row[1]) {
        const dataPoint = {
          timestamp: formatTimestamp(row[0]),  // GAS Time
          machineTime: row[1],                 // Machine Time
          machineId: row[2],                   // Machine ID
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

    // Sort by timestamp
    machineData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return machineData;
  } catch (error) {
    logError("getMachineDataFromSheet", error);
    throw error;
  }
}

/**
 * Get machine active status from K1 cell
 * @param {Sheet} sheet - Target sheet
 * @returns {boolean} Active status
 */
function getMachineActiveStatus(sheet) {
  try {
    const activeValue = sheet.getRange(1, 11).getValue();
    return activeValue === true || activeValue === 'TRUE';
  } catch (error) {
    console.error(`Error getting active status for sheet ${sheet.getName()}:`, error);
    return false;
  }
}

/**
 * Set machine active status in K1 cell
 * @param {string} machineId - Machine ID
 * @param {boolean} isActive - Active status
 * @returns {Object} Update result
 */
function setMachineActiveStatus(machineId, isActive) {
  try {
    if (!isValidMachineId(machineId)) {
      throw new Error(`Invalid machine ID: ${machineId}`);
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = `Machine_${machineId}`;
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`Machine ${machineId} not found`);
    }

    sheet.getRange(1, 11).setValue(isActive);
    console.log(`Machine ${machineId} active status set to: ${isActive}`);

    return {
      status: "success",
      message: `Machine ${machineId} active status updated`,
      machineId: machineId,
      isActive: isActive
    };
  } catch (error) {
    logError("setMachineActiveStatus", error);
    return {
      status: "error",
      message: error.toString()
    };
  }
}

/**
 * Get machine statistics
 * @returns {Object} Machine statistics
 */
function getMachineStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    
    const stats = {
      total_machines: 0,
      active_machines: 0,
      inactive_machines: 0,
      machines_with_data: 0,
      total_data_points: 0,
      last_updated: new Date().toISOString()
    };

    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      if (sheetName.startsWith("Machine_")) {
        stats.total_machines++;
        
        const isActive = getMachineActiveStatus(sheet);
        if (isActive) {
          stats.active_machines++;
        } else {
          stats.inactive_machines++;
        }
        
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          stats.machines_with_data++;
          stats.total_data_points += (lastRow - 1);
        }
      }
    });

    return stats;
  } catch (error) {
    logError("getMachineStatistics", error);
    return { error: error.toString() };
  }
}