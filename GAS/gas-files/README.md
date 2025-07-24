# Google Apps Script Files
Discord WebHook Notification System v1.0.0

## 📁 File Structure

This directory contains all Google Apps Script files for the Discord WebHook notification system.

### Core Files

1. **Main.gs** - WebApp entry points (doGet, doPost)
2. **Config.gs** - Configuration and settings management
3. **DataManager.gs** - Data storage and retrieval functions
4. **MachineMonitor.gs** - Machine monitoring and timeout detection
5. **WebhookNotification.gs** - Discord notification functions
6. **Utils.gs** - Utility functions and helpers
7. **Test.gs** - Test functions for development and debugging

### Legacy File

- **SpreadSheets_GAS.gs** - Original monolithic file (for reference)

## 🚀 Deployment Instructions

### 1. Google Apps Script Setup

1. Open [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Delete the default `Code.gs` file
4. Create new files with the exact names listed above
5. Copy the content from each file in this directory

### 2. Initial Configuration

1. Run the `initialSetup()` function from Config.gs
2. Set the Discord WebHook URL in Script Properties:
   - Go to Project Settings → Script Properties
   - Add key: `DISCORD_WEBHOOK_URL`
   - Add value: Your Discord webhook URL

### 3. Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Set execute as: "Me"
4. Set access: "Anyone" (or as required)
5. Deploy and note the Web App URL

## ⚙️ Configuration

### Script Properties

Set these in Project Settings → Script Properties:

| Key | Default Value | Description |
|-----|---------------|-------------|
| `DISCORD_WEBHOOK_URL` | (required) | Discord webhook URL |
| `TIMEOUT_MINUTES` | 10 | Signal timeout in minutes |
| `CHECK_INTERVAL_MINUTES` | 1 | Monitoring check interval |
| `REMINDER_INTERVAL_MINUTES` | 10 | Reminder notification interval |
| `ENABLE_NOTIFICATIONS` | true | Enable/disable notifications |

### Trigger Setup

The `initialSetup()` function automatically creates a time-based trigger that runs `checkMachineSignals()` every minute.

## 🧪 Testing

### Basic Tests

1. Run `runAllTests()` to test all components
2. Run `testDiscordNotifications()` to test Discord integration
3. Run `createTestMachine()` to create a test machine

### Manual Testing

1. Create a test machine using `createTestMachine()`
2. Set the machine to inactive using `setMachineActiveStatus(machineId, false)`
3. Wait for timeout and check Discord notifications
4. Set the machine back to active to test recovery notification

## 📊 Monitoring

### View Statistics

- Run `getMachineMonitoringStats()` for monitoring overview
- Run `getMachineStatistics()` for machine statistics
- Check `_MachineMonitorStatus` sheet for current status
- Check `_ErrorLog` sheet for error logs

### API Endpoints

The WebApp supports these GET actions:
- `?action=getMachineList` - List all machines
- `?action=getAllMachines` - Get all machine data
- `?action=getMachine&machineId=XXX` - Get specific machine
- `?action=getMonitoringStats` - Get monitoring statistics
- `?action=getConfigStatus` - Get configuration status

## 🔧 Maintenance

### Trigger Management

- `setupTriggers()` - Create monitoring triggers
- `deleteTriggers()` - Remove monitoring triggers

### Status Management

- `resetMachineMonitorStatus(machineId)` - Reset machine status
- `checkSpecificMachine(machineId)` - Manual machine check

### Logging

All errors are logged to:
1. Console logs (Apps Script editor)
2. `_ErrorLog` sheet (if enabled)

## 🚨 Troubleshooting

### Common Issues

1. **Notifications not working:**
   - Check Discord webhook URL in script properties
   - Verify `ENABLE_NOTIFICATIONS` is set to "true"
   - Check trigger execution history

2. **Timeout not detected:**
   - Verify machine is set to active (K1 cell = TRUE)
   - Check if recent data exists in machine sheet
   - Verify trigger is running every minute

3. **Permission errors:**
   - Ensure script has spreadsheet access permissions
   - Check if the spreadsheet is accessible to the script

### Debug Functions

- `getConfigStatus()` - Check configuration
- `getMachineMonitoringStats()` - View monitoring status
- `sendTestNotification()` - Test Discord connection

## 📋 File Dependencies

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

## 🔄 Version History

- **v1.0.0** - Initial Discord WebHook notification system
  - Machine monitoring with K1 cell active status
  - Discord notifications (lost, reminder, recovery)
  - Modular file structure
  - English localization

## 📞 Support

For issues or questions:
1. Check the console logs in Apps Script editor
2. Review the `_ErrorLog` sheet for detailed error information
3. Run test functions to isolate issues
4. Check script properties configuration