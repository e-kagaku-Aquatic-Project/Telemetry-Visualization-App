// Utils.gs - Utility Functions
// Discord WebHook Notification System v1.1.0

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
  
  console.log(`[DEBUG] Retrieved monitor status: ${JSON.stringify(status)}`);
  return status;
}

/**
 * Update monitor status in sheet
 * @param {Spreadsheet} spreadsheet - Target spreadsheet
 * @param {Object} status - Status data to update
 */
function updateMonitorStatus(spreadsheet, status) {
  const sheet = getOrCreateMonitorSheet(spreadsheet);
  
  // Clear existing data (safely)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    try {
      sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
    } catch (error) {
      console.error('Error clearing content:', error);
      // If clearing fails, try to delete rows one by one
      for (let i = lastRow; i > 1; i--) {
        try {
          sheet.deleteRow(i);
        } catch (deleteError) {
          console.error(`Error deleting row ${i}:`, deleteError);
          break;
        }
      }
    }
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
  
  console.log(`[DEBUG] Updated monitor status with ${data.length} entries`);
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