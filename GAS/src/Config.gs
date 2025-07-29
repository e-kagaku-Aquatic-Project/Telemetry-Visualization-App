// Config.gs - Settings and Configuration Management
// Discord WebHook Notification System v1.1.0
// Changed: Reminder notifications deprecated - only lost/recovery notifications

/**
 * Configuration constants loaded from script properties
 */
const CONFIG = {
  DISCORD_WEBHOOK_URL: getScriptProperty('DISCORD_WEBHOOK_URL'),
  TIMEOUT_MINUTES: parseInt(getScriptProperty('TIMEOUT_MINUTES') || '10'),
  CHECK_INTERVAL_MINUTES: parseInt(getScriptProperty('CHECK_INTERVAL_MINUTES') || '1'),
  REMINDER_INTERVAL_MINUTES: parseInt(getScriptProperty('REMINDER_INTERVAL_MINUTES') || '10'), // Deprecated in v1.1.0 - no longer used
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
 * Update reminder interval for lost machine notifications
 * @deprecated Since v1.1.0 - Reminder notifications have been removed
 * @param {number} minutes - Interval in minutes (default: 10)
 */
function updateReminderInterval(minutes = 10) {
  try {
    setScriptProperty('REMINDER_INTERVAL_MINUTES', minutes.toString());
    console.log(`Reminder interval updated to ${minutes} minutes`);
    return {
      status: 'success',
      message: `Reminder interval updated to ${minutes} minutes. Please restart triggers to apply changes.`
    };
  } catch (error) {
    console.error('Error updating reminder interval:', error);
    return {
      status: 'error',
      message: error.toString()
    };
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