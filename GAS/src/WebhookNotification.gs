// WebhookNotification.gs - Discord WebHook Notification System
// Discord WebHook Notification System v1.0.0

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
 * Send signal lost reminder notification (every 10 minutes)
 * @param {Object} machine - Machine data object
 * @param {number} notificationCount - Current notification count
 * @param {number} lostDurationMinutes - Duration since signal lost
 */
function sendLostReminderNotification(machine, notificationCount, lostDurationMinutes) {
  try {
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
    console.log(`Reminder notification #${notificationCount} sent for machine ${machine.machineId}`);
  } catch (error) {
    logError('sendLostReminderNotification', error);
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
        
      case 'reminder':
        embed = {
          title: "🧪 Test - Signal Lost Reminder",
          description: "This is a test notification for reminder",
          color: 16753920,
          fields: [
            { name: "Machine ID", value: "TEST001", inline: true },
            { name: "Test Type", value: "Reminder Test", inline: true },
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