// MachineMonitor.gs - Machine Monitoring and Status Management
// Discord WebHook Notification System v1.0.0

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
        // Continuing signal lost - check if reminder notification needed
        const lastNotified = new Date(currentStatus.lastNotified);
        const minutesSinceLastNotification = (now - lastNotified) / (1000 * 60);
        
        if (minutesSinceLastNotification >= CONFIG.REMINDER_INTERVAL_MINUTES) {
          // Send reminder notification
          const notificationCount = currentStatus.notificationCount + 1;
          sendLostReminderNotification(machine, notificationCount, diffMinutes);
          monitorStatus[machine.machineId] = {
            ...currentStatus,
            lastNotified: now.toISOString(),
            notificationCount: notificationCount
          };
          console.log(`Reminder notification #${notificationCount} sent for machine ${machine.machineId}`);
        }
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