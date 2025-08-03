// ================================================================
// Telemetry Tracking System with Discord Notification v2.0.0
// ================================================================
// Made by Shintaro Matsumoto
// 
// This integrated system combines telemetry data collection
// with Discord webhook notifications for signal loss detection.
// 
// Features:
// - Telemetry data storage in Google Sheets
// - Automatic machine sheet creation
// - Signal loss detection (after 10 minutes timeout)
// - Discord notifications on signal lost and recovery only (no reminders)
// - WebApp API for data retrieval
// - Machine active status management
//
// Setup Instructions:
// 1. Open Google Sheets
// 2. Go to Extensions > Apps Script
// 3. Delete all existing code
// 4. Copy and paste this entire file
// 5. Save the project (Ctrl+S or Cmd+S)
// 6. Run initialSetup() function
// 7. Set Script Properties:
//    - Go to Project Settings > Script Properties
//    - Add: DISCORD_WEBHOOK_URL = your_discord_webhook_url
// 8. Deploy as Web App:
//    - Click Deploy > New Deployment
//    - Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
//    - Deploy and copy the Web App URL
// 9. The system will automatically check for signal loss every minute
//
// ================================================================

// ================================================================
// CONFIG MODULE - Settings and Configuration Management
// ================================================================

/**
 * Configuration constants loaded from script properties
 */
const CONFIG = {
  DISCORD_WEBHOOK_URL: getScriptProperty('DISCORD_WEBHOOK_URL'),
  TIMEOUT_MINUTES: parseInt(getScriptProperty('TIMEOUT_MINUTES') || '10'),
  CHECK_INTERVAL_MINUTES: parseInt(getScriptProperty('CHECK_INTERVAL_MINUTES') || '1'),
  REMINDER_INTERVAL_MINUTES: parseInt(getScriptProperty('REMINDER_INTERVAL_MINUTES') || '10'),
  ENABLE_NOTIFICATIONS: getScriptProperty('ENABLE_NOTIFICATIONS') === 'true',
  MAX_RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000
};

/**
 * Get script property value
 * @param {string} key - Property key
 * @returns {string|null} Property value
 */
function getScriptProperty(key) {
  try {
    return PropertiesService.getScriptProperties().getProperty(key);
  } catch (error) {
    console.error(`Error getting script property ${key}:`, error);
    return null;
  }
}

/**
 * Set script property value
 * @param {string} key - Property key
 * @param {string} value - Property value
 */
function setScriptProperty(key, value) {
  try {
    PropertiesService.getScriptProperties().setProperty(key, value);
    console.log(`Script property ${key} set successfully`);
  } catch (error) {
    console.error(`Error setting script property ${key}:`, error);
    throw error;
  }
}

/**
 * Setup triggers for machine monitoring
 */
function setupTriggers() {
  try {
    // Delete existing triggers for checkMachineSignals
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'checkMachineSignals') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Create new trigger (every minute)
    ScriptApp.newTrigger('checkMachineSignals')
      .timeBased()
      .everyMinutes(CONFIG.CHECK_INTERVAL_MINUTES)
      .create();

    console.log(`Trigger setup completed (interval: ${CONFIG.CHECK_INTERVAL_MINUTES} minutes)`);
  } catch (error) {
    console.error('Error setting up triggers:', error);
    throw error;
  }
}

/**
 * Delete all monitoring triggers
 */
function deleteTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let deletedCount = 0;
    
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'checkMachineSignals') {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
      }
    });

    console.log(`${deletedCount} monitoring triggers deleted`);
  } catch (error) {
    console.error('Error deleting triggers:', error);
    throw error;
  }
}

/**
 * Initial setup for the notification system
 */
function initialSetup() {
  try {
    console.log('Starting initial setup...');

    // Setup default script properties
    const properties = {
      'DISCORD_WEBHOOK_URL': '', // Must be configured manually
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

    // Setup triggers
    setupTriggers();

    // Create monitor status sheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    getOrCreateMonitorSheet(spreadsheet);

    console.log('Initial setup completed successfully');
    console.log('IMPORTANT: Please set DISCORD_WEBHOOK_URL in script properties');
  } catch (error) {
    console.error('Initial setup failed:', error);
    throw error;
  }
}

/**
 * Get current configuration status
 * @returns {Object} Configuration status
 */
function getConfigStatus() {
  return {
    discord_webhook_configured: !!CONFIG.DISCORD_WEBHOOK_URL,
    timeout_minutes: CONFIG.TIMEOUT_MINUTES,
    check_interval_minutes: CONFIG.CHECK_INTERVAL_MINUTES,
    reminder_interval_minutes: CONFIG.REMINDER_INTERVAL_MINUTES,
    notifications_enabled: CONFIG.ENABLE_NOTIFICATIONS,
    triggers_count: ScriptApp.getProjectTriggers().filter(t => 
      t.getHandlerFunction() === 'checkMachineSignals'
    ).length
  };
}

// ================================================================
// UTILS MODULE - Utility Functions
// ================================================================

/**
 * Format timestamp to ISO string
 * @param {Date|string} timestamp - Timestamp to format
 * @returns {string} ISO formatted timestamp
 */
function formatTimestamp(timestamp) {
  try {
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    } else if (typeof timestamp === "string") {
      // Already in ISO format
      if (timestamp.includes("T") && timestamp.includes("Z")) {
        return timestamp;
      }
      // Convert date string to Date object
      const date = new Date(timestamp);
      return date.toISOString();
    } else {
      // Default to current time
      return new Date().toISOString();
    }
  } catch (error) {
    console.error("formatTimestamp Error:", error.toString());
    return new Date().toISOString();
  }
}

/**
 * Format date and time for JST timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateTimeJST(date) {
  try {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return Utilities.formatDate(date, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
  } catch (error) {
    console.error("formatDateTimeJST Error:", error.toString());
    return new Date().toISOString();
  }
}

/**
 * Create success response for WebApp
 * @param {Object} data - Response data
 * @returns {ContentService.TextOutput} Success response
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
 * Create error response for WebApp
 * @param {string} message - Error message
 * @returns {ContentService.TextOutput} Error response
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

/**
 * Get or create monitor status sheet
 * @param {Spreadsheet} spreadsheet - Target spreadsheet
 * @returns {Sheet} Monitor status sheet
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
    
    // Header styling
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#666666");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");
    
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    
    console.log(`Monitor status sheet created: ${sheetName}`);
  }
  
  return sheet;
}

/**
 * Get monitor status from sheet
 * @param {Spreadsheet} spreadsheet - Target spreadsheet
 * @returns {Object} Monitor status data
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
 * Update monitor status in sheet
 * @param {Spreadsheet} spreadsheet - Target spreadsheet
 * @param {Object} status - Status data to update
 */
function updateMonitorStatus(spreadsheet, status) {
  const sheet = getOrCreateMonitorSheet(spreadsheet);
  
  // Clear existing data
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  // Write new data
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

/**
 * Get last update time from sheet
 * @param {Sheet} sheet - Target sheet
 * @returns {string|null} Last update time
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
    console.error("getLastUpdateTime Error:", error.toString());
    return null;
  }
}

/**
 * Log error to console and optionally to error log sheet
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
function logError(context, error) {
  console.error(`[${context}] ${error.toString()}`);
  
  // Record error to log sheet (optional)
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = spreadsheet.getSheetByName('_ErrorLog');
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet('_ErrorLog');
      logSheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Context', 'Error']]);
      
      // Header styling
      const headerRange = logSheet.getRange(1, 1, 1, 3);
      headerRange.setBackground("#cc0000");
      headerRange.setFontColor("white");
      headerRange.setFontWeight("bold");
      logSheet.setFrozenRows(1);
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

/**
 * Validate machine ID format
 * @param {string} machineId - Machine ID to validate
 * @returns {boolean} True if valid
 */
function isValidMachineId(machineId) {
  if (!machineId || typeof machineId !== 'string') {
    return false;
  }
  // Machine ID should be alphanumeric and reasonable length
  return /^[a-zA-Z0-9_-]{1,20}$/.test(machineId);
}

/**
 * Check if execution time is approaching limit
 * @param {Date} startTime - Function start time
 * @param {number} maxExecutionMs - Maximum execution time in milliseconds
 * @returns {boolean} True if approaching limit
 */
function isApproachingTimeLimit(startTime, maxExecutionMs = 5 * 60 * 1000) {
  return (new Date() - startTime) > maxExecutionMs;
}

// ================================================================
// DATA MANAGER MODULE - Data Management Functions
// ================================================================

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

// ================================================================
// MACHINE MONITOR MODULE - Machine Monitoring and Status Management
// ================================================================
// Changed: Notifications only on signal lost and recovery (no reminders)

/**
 * Main monitoring function triggered every minute
 * Checks all active machines for signal timeout
 */
function checkMachineSignals() {
  const startTime = new Date();
  
  try {
    if (!CONFIG.ENABLE_NOTIFICATIONS) {
      console.log('Notification system is disabled');
      return;
    }
    
    console.log('Starting machine signal check...');
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const activeMachines = getActiveMachines(spreadsheet);
    const monitorStatus = getMonitorStatus(spreadsheet);
    
    console.log(`Found ${activeMachines.length} active machines to monitor`);
    
    let processedCount = 0;
    activeMachines.forEach(machine => {
      // Check execution time limit
      if (isApproachingTimeLimit(startTime)) {
        console.log('Approaching execution time limit, stopping processing');
        return;
      }
      
      checkMachineTimeout(machine, monitorStatus);
      processedCount++;
    });
    
    // Update monitor status sheet
    updateMonitorStatus(spreadsheet, monitorStatus);
    
    console.log(`Machine signal check completed. Processed ${processedCount} machines`);
  } catch (error) {
    logError('checkMachineSignals', error);
  }
}

/**
 * Get list of active machines from all machine sheets
 * @param {Spreadsheet} spreadsheet - Target spreadsheet
 * @returns {Array} Array of active machine objects
 */
function getActiveMachines(spreadsheet) {
  const sheets = spreadsheet.getSheets();
  const activeMachines = [];
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName.startsWith('Machine_')) {
      const machineId = sheetName.replace('Machine_', '');
      
      try {
        // Check K1 cell (row 1, column 11) for active status
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
      } catch (error) {
        console.error(`Error checking machine ${machineId}:`, error);
      }
    }
  });
  
  return activeMachines;
}

/**
 * Check timeout for a specific machine
 * @param {Object} machine - Machine object
 * @param {Object} monitorStatus - Current monitor status object
 */
function checkMachineTimeout(machine, monitorStatus) {
  try {
    const now = new Date();
    const lastDataTime = new Date(machine.lastDataTime);
    const diffMinutes = (now - lastDataTime) / (1000 * 60);
    
    const currentStatus = monitorStatus[machine.machineId] || { 
      status: 'normal', 
      notificationCount: 0,
      firstLostTime: null
    };
    
    if (diffMinutes >= CONFIG.TIMEOUT_MINUTES) {
      // Timeout detected
      if (currentStatus.status !== 'lost') {
        // New signal lost - send initial notification
        sendLostNotification(machine, 1, diffMinutes);
        monitorStatus[machine.machineId] = {
          status: 'lost',
          lastNotified: now.toISOString(),
          lastDataReceived: lastDataTime.toISOString(),
          notificationCount: 1,
          firstLostTime: now.toISOString()
        };
        console.log(`Signal lost detected for machine ${machine.machineId}`);
      } else {
        // Continuing signal lost - no reminder notifications
        // Just keep the status as lost without sending additional notifications
        console.log(`Machine ${machine.machineId} still in lost state (no reminder sent)`);
      }
    } else {
      // Normal communication
      if (currentStatus.status === 'lost') {
        // Recovery detected - send recovery notification
        const lostDuration = (now - new Date(currentStatus.firstLostTime)) / (1000 * 60);
        sendRecoveryNotification(machine, currentStatus.notificationCount, lostDuration);
        monitorStatus[machine.machineId] = {
          status: 'normal',
          lastNotified: now.toISOString(),
          lastDataReceived: lastDataTime.toISOString(),
          notificationCount: 0,
          firstLostTime: null
        };
        console.log(`Signal recovery detected for machine ${machine.machineId}`);
      } else {
        // Update last data received time for normal status
        if (currentStatus.lastDataReceived !== lastDataTime.toISOString()) {
          monitorStatus[machine.machineId] = {
            ...currentStatus,
            lastDataReceived: lastDataTime.toISOString()
          };
        }
      }
    }
  } catch (error) {
    logError(`checkMachineTimeout-${machine.machineId}`, error);
  }
}

/**
 * Get machine monitoring statistics
 * @returns {Object} Monitoring statistics
 */
function getMachineMonitoringStats() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const activeMachines = getActiveMachines(spreadsheet);
    const monitorStatus = getMonitorStatus(spreadsheet);
    
    const stats = {
      total_machines: 0,
      active_machines: activeMachines.length,
      normal_machines: 0,
      lost_machines: 0,
      last_check: new Date().toISOString(),
      machines: []
    };
    
    // Count all machines
    const sheets = spreadsheet.getSheets();
    sheets.forEach(sheet => {
      if (sheet.getName().startsWith('Machine_')) {
        stats.total_machines++;
      }
    });
    
    // Analyze active machines
    activeMachines.forEach(machine => {
      const status = monitorStatus[machine.machineId];
      const machineStats = {
        machine_id: machine.machineId,
        status: status ? status.status : 'normal',
        last_data_time: formatDateTimeJST(machine.lastDataTime),
        minutes_since_last_data: Math.floor((new Date() - new Date(machine.lastDataTime)) / (1000 * 60))
      };
      
      if (status && status.status === 'lost') {
        stats.lost_machines++;
        machineStats.notification_count = status.notificationCount;
        machineStats.first_lost_time = formatDateTimeJST(status.firstLostTime);
      } else {
        stats.normal_machines++;
      }
      
      stats.machines.push(machineStats);
    });
    
    return stats;
  } catch (error) {
    logError('getMachineMonitoringStats', error);
    return { error: error.toString() };
  }
}

/**
 * Manually trigger timeout check for specific machine
 * @param {string} machineId - Machine ID to check
 * @returns {Object} Check result
 */
function checkSpecificMachine(machineId) {
  try {
    if (!isValidMachineId(machineId)) {
      throw new Error(`Invalid machine ID: ${machineId}`);
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const activeMachines = getActiveMachines(spreadsheet);
    const targetMachine = activeMachines.find(m => m.machineId === machineId);
    
    if (!targetMachine) {
      return {
        status: 'error',
        message: `Machine ${machineId} not found or not active`
      };
    }
    
    const monitorStatus = getMonitorStatus(spreadsheet);
    checkMachineTimeout(targetMachine, monitorStatus);
    updateMonitorStatus(spreadsheet, monitorStatus);
    
    return {
      status: 'success',
      message: `Timeout check completed for machine ${machineId}`,
      machine_status: monitorStatus[machineId] || { status: 'normal' }
    };
  } catch (error) {
    logError('checkSpecificMachine', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Reset monitoring status for specific machine
 * @param {string} machineId - Machine ID to reset
 * @returns {Object} Reset result
 */
function resetMachineMonitorStatus(machineId) {
  try {
    if (!isValidMachineId(machineId)) {
      throw new Error(`Invalid machine ID: ${machineId}`);
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const monitorStatus = getMonitorStatus(spreadsheet);
    
    if (monitorStatus[machineId]) {
      delete monitorStatus[machineId];
      updateMonitorStatus(spreadsheet, monitorStatus);
      console.log(`Monitor status reset for machine ${machineId}`);
      return {
        status: 'success',
        message: `Monitor status reset for machine ${machineId}`
      };
    } else {
      return {
        status: 'error',
        message: `No monitor status found for machine ${machineId}`
      };
    }
  } catch (error) {
    logError('resetMachineMonitorStatus', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// ================================================================
// WEBHOOK NOTIFICATION MODULE - Discord WebHook Notification System
// ================================================================

/**
 * Send signal lost notification (initial)
 * @param {Object} machine - Machine data object
 * @param {number} notificationCount - Current notification count
 * @param {number} lostDurationMinutes - Duration since signal lost
 */
function sendLostNotification(machine, notificationCount, lostDurationMinutes) {
  try {
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
    console.log(`Initial lost notification sent for machine ${machine.machineId}`);
  } catch (error) {
    logError('sendLostNotification', error);
  }
}

/**
 * Send signal recovery notification
 * @param {Object} machine - Machine data object
 * @param {number} totalNotificationCount - Total notifications sent
 * @param {number} totalLostDurationMinutes - Total duration lost
 */
function sendRecoveryNotification(machine, totalNotificationCount, totalLostDurationMinutes) {
  try {
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
    console.log(`Recovery notification sent for machine ${machine.machineId}`);
  } catch (error) {
    logError('sendRecoveryNotification', error);
  }
}

/**
 * Send Discord WebHook notification with retry logic
 * @param {Object} payload - Discord webhook payload
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
      } else {
        console.warn(`Discord API returned status: ${response.getResponseCode()}`);
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

/**
 * Send test notification to verify Discord webhook
 * @param {string} testType - Type of test notification
 */
function sendTestNotification(testType = 'connection') {
  try {
    let embed;
    
    switch (testType) {
      case 'lost':
        embed = {
          title: "🧪 Test - Machine Signal Lost",
          description: "This is a test notification for signal lost",
          color: 15158332,
          fields: [
            { name: "Machine ID", value: "TEST001", inline: true },
            { name: "Test Type", value: "Signal Lost Test", inline: true },
            { name: "Status", value: "Test notification", inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Telemetry Monitoring System - Test" }
        };
        break;
        
      case 'recovery':
        embed = {
          title: "🧪 Test - Signal Recovery",
          description: "This is a test notification for recovery",
          color: 3066993,
          fields: [
            { name: "Machine ID", value: "TEST001", inline: true },
            { name: "Test Type", value: "Recovery Test", inline: true },
            { name: "Status", value: "Test notification", inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Telemetry Monitoring System - Test" }
        };
        break;
        
      default:
        embed = {
          title: "🧪 Test - Connection Check",
          description: "Discord WebHook connection test successful",
          color: 5793266,
          fields: [
            { name: "System", value: "Telemetry Monitoring", inline: true },
            { name: "Status", value: "Operational", inline: true },
            { name: "Test Time", value: formatDateTimeJST(new Date()), inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Telemetry Monitoring System - Test" }
        };
    }
    
    sendDiscordNotification({ embeds: [embed] });
    console.log(`Test notification sent: ${testType}`);
  } catch (error) {
    logError('sendTestNotification', error);
  }
}

// ================================================================
// MAIN MODULE - Main Entry Points for WebApp
// ================================================================

/**
 * WebApp main entry point for GET requests
 * @param {Object} e - Event object containing parameters
 * @returns {ContentService.TextOutput} Response
 */
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

      case "getMonitoringStats":
        const stats = getMachineMonitoringStats();
        return createSuccessResponse(stats);

      case "getMachineStats":
        const machineStats = getMachineStatistics();
        return createSuccessResponse(machineStats);

      case "getConfigStatus":
        const configStatus = getConfigStatus();
        return createSuccessResponse(configStatus);

      default:
        return createErrorResponse("Invalid action");
    }
  } catch (error) {
    console.error("doGet Error:", error.toString());
    return createErrorResponse(error.toString());
  }
}

/**
 * WebApp main entry point for POST requests
 * @param {Object} e - Event object containing POST data
 * @returns {ContentService.TextOutput} Response
 */
function doPost(e) {
  try {
    // Get POST data
    const data = JSON.parse(e.postData.contents);

    // Check action type
    if (data.action === "registerMachine") {
      // Machine registration
      const result = registerMachine(data);
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "setActiveStatus") {
      // Set machine active status
      const result = setMachineActiveStatus(data.machineId, data.isActive);
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "checkMachine") {
      // Manual machine check
      const result = checkSpecificMachine(data.machineId);
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "resetMonitorStatus") {
      // Reset monitor status
      const result = resetMachineMonitorStatus(data.machineId);
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "testNotification") {
      // Test notification
      sendTestNotification(data.testType || 'connection');
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          message: "Test notification sent"
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Normal telemetry data save
      const result = saveToSpreadsheet(data);

      // Return response
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
    console.error("doPost Error:", error.toString());

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ================================================================
// TEST MODULE - Test Functions
// ================================================================

/**
 * Test function for manual execution
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
  console.log("Test result:", JSON.stringify(result));
}

/**
 * Test Discord notification system
 */
function testDiscordNotifications() {
  try {
    console.log("=== Discord Notification Test ===");

    // Test basic connection
    console.log("Testing connection...");
    sendTestNotification('connection');
    
    // Wait a bit between notifications
    Utilities.sleep(2000);
    
    // Test signal lost notification
    console.log("Testing signal lost notification...");
    sendTestNotification('lost');
    
    Utilities.sleep(2000);
    
    // Test recovery notification
    console.log("Testing recovery notification...");
    sendTestNotification('recovery');

    console.log("=== Discord Notification Test Completed ===");
  } catch (error) {
    console.error("Discord Notification Test Error:", error.toString());
  }
}

/**
 * Quick test to verify system setup
 */
function quickSystemTest() {
  console.log("=== Quick System Test ===");
  
  // Check configuration
  const config = getConfigStatus();
  console.log("Configuration Status:", config);
  
  // Check machine statistics
  const stats = getMachineStatistics();
  console.log("Machine Statistics:", stats);
  
  // Check monitoring status
  const monitoringStats = getMachineMonitoringStats();
  console.log("Monitoring Statistics:", monitoringStats);
  
  console.log("=== Test Complete ===");
}

// ================================================================
// End of Integrated System
// ================================================================