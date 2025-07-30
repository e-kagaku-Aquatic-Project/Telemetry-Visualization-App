// Test.gs - Test Functions
// Discord WebHook Notification System v1.1.0
// Changed: Removed reminder notification tests

/**
 * Test function for manual execution (legacy)
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
 * WebApp API test function (legacy)
 */
function testWebAppAPI() {
  try {
    console.log("=== WebApp API Test ===");

    // Test getAllMachinesData
    console.log("Testing getAllMachinesData...");
    const allMachinesResult = getAllMachinesData();
    const allMachinesData = JSON.parse(allMachinesResult.getContent());
    console.log("All machines result:", allMachinesData);

    // Test getMachineList
    console.log("Testing getMachineList...");
    const machineListResult = getMachineList();
    const machineListData = JSON.parse(machineListResult.getContent());
    console.log("Machine list result:", machineListData);

    // Test specific machine data
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
    
    // Reminder notification removed in v1.1.0
    
    // Test recovery notification
    console.log("Testing recovery notification...");
    sendTestNotification('recovery');

    console.log("=== Discord Notification Test Completed ===");
  } catch (error) {
    console.error("Discord Notification Test Error:", error.toString());
  }
}

/**
 * Test machine monitoring system
 */
function testMachineMonitoring() {
  try {
    console.log("=== Machine Monitoring Test ===");

    // Get monitoring stats
    console.log("Getting monitoring stats...");
    const stats = getMachineMonitoringStats();
    console.log("Monitoring stats:", stats);

    // Test specific machine check
    if (stats.machines && stats.machines.length > 0) {
      const testMachineId = stats.machines[0].machine_id;
      console.log(`Testing specific machine check for ${testMachineId}...`);
      const checkResult = checkSpecificMachine(testMachineId);
      console.log("Check result:", checkResult);
    }

    console.log("=== Machine Monitoring Test Completed ===");
  } catch (error) {
    console.error("Machine Monitoring Test Error:", error.toString());
  }
}

/**
 * Test configuration functions
 */
function testConfigFunctions() {
  try {
    console.log("=== Configuration Test ===");

    // Test config status
    console.log("Getting config status...");
    const configStatus = getConfigStatus();
    console.log("Config status:", configStatus);

    // Test script properties
    console.log("Testing script properties...");
    const testKey = 'TEST_PROPERTY';
    const testValue = 'test_value_' + new Date().getTime();
    
    setScriptProperty(testKey, testValue);
    const retrievedValue = getScriptProperty(testKey);
    
    if (retrievedValue === testValue) {
      console.log("Script property test: PASSED");
    } else {
      console.log("Script property test: FAILED");
    }

    console.log("=== Configuration Test Completed ===");
  } catch (error) {
    console.error("Configuration Test Error:", error.toString());
  }
}

/**
 * Test data management functions
 */
function testDataManagerFunctions() {
  try {
    console.log("=== Data Manager Test ===");

    // Test machine statistics
    console.log("Getting machine statistics...");
    const machineStats = getMachineStatistics();
    console.log("Machine statistics:", machineStats);

    // Test active status functions
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    
    // Find a machine sheet to test
    let testMachineId = null;
    for (const sheet of sheets) {
      if (sheet.getName().startsWith('Machine_')) {
        testMachineId = sheet.getName().replace('Machine_', '');
        break;
      }
    }

    if (testMachineId) {
      console.log(`Testing active status for machine ${testMachineId}...`);
      
      // Test getting active status
      const sheet = spreadsheet.getSheetByName(`Machine_${testMachineId}`);
      const currentStatus = getMachineActiveStatus(sheet);
      console.log(`Current active status: ${currentStatus}`);
      
      // Test setting active status
      const setResult = setMachineActiveStatus(testMachineId, currentStatus);
      console.log("Set active status result:", setResult);
    }

    console.log("=== Data Manager Test Completed ===");
  } catch (error) {
    console.error("Data Manager Test Error:", error.toString());
  }
}

/**
 * Test system setup and initialization
 */
function testSystemSetup() {
  try {
    console.log("=== System Setup Test ===");

    // Test monitor sheet creation
    console.log("Testing monitor sheet creation...");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const monitorSheet = getOrCreateMonitorSheet(spreadsheet);
    console.log(`Monitor sheet exists: ${monitorSheet.getName()}`);

    // Test monitor status functions
    console.log("Testing monitor status functions...");
    const monitorStatus = getMonitorStatus(spreadsheet);
    console.log("Current monitor status:", monitorStatus);

    console.log("=== System Setup Test Completed ===");
  } catch (error) {
    console.error("System Setup Test Error:", error.toString());
  }
}

/**
 * Run all tests sequentially
 */
function runAllTests() {
  console.log("=== Starting all tests ===");
  
  try {
    // System setup test
    testSystemSetup();
    
    // Configuration tests
    testConfigFunctions();
    
    // Data manager tests
    testDataManagerFunctions();
    
    // Legacy API tests
    testWebAppAPI();
    
    // Machine monitoring tests
    testMachineMonitoring();
    
    // Note: Discord notification test is separate due to external dependency
    console.log("Note: Run testDiscordNotifications() separately to test Discord integration");
    
    console.log("=== All tests completed ===");
  } catch (error) {
    console.error("Test suite error:", error.toString());
  }
}

/**
 * Create test machine for demonstration
 */
function createTestMachine() {
  try {
    console.log("=== Creating Test Machine ===");
    
    const testMachineId = "TEST" + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Register test machine
    const registrationData = {
      action: "registerMachine",
      MachineID: testMachineId,
      metadata: {
        type: "test",
        created: new Date().toISOString(),
        purpose: "System testing"
      }
    };
    
    const regResult = registerMachine(registrationData);
    console.log("Registration result:", regResult);
    
    if (regResult.status === "success") {
      // Add some test data
      const testData = {
        DataType: "TEST",
        MachineID: testMachineId,
        MachineTime: Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd H:mm:ss"),
        GPS: {
          LAT: 35.6762 + (Math.random() - 0.5) * 0.01,
          LNG: 139.6503 + (Math.random() - 0.5) * 0.01,
          ALT: 10 + Math.random() * 100,
          SAT: 8 + Math.floor(Math.random() * 8),
        },
        BAT: 3.0 + Math.random() * 1.2,
        CMT: "Test data generated automatically",
      };
      
      const saveResult = saveToSpreadsheet(testData);
      console.log("Test data save result:", saveResult);
      
      console.log(`Test machine ${testMachineId} created successfully`);
      return testMachineId;
    } else {
      console.error("Failed to create test machine:", regResult.message);
      return null;
    }
  } catch (error) {
    console.error("Create test machine error:", error.toString());
    return null;
  }
}