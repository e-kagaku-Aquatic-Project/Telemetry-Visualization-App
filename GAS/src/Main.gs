// Main.gs - Main Entry Points for WebApp
// Discord WebHook Notification System v1.1.0
// Made by Shintaro Matsumoto
// Changed: Reminder notifications removed - only lost/recovery notifications

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

/**
 * Legacy function maintained for backward compatibility
 * Use initialSetup() from Config.gs instead
 */
function setupWebhookSystem() {
  console.log("Please use initialSetup() function from Config.gs");
  return initialSetup();
}