# Discord Monitoring System - Requirements Specification

## Document Information

- **Document Type**: Requirements Specification
- **Version**: 1.0.0
- **Date**: 2025-07-21
- **Author**: System Architecture Team
- **Status**: Draft

---

## 1. Overview

### 1.1 Purpose
This document defines the requirements for enhancing the Google Apps Script-based telemetry data management system with operational status management and Discord anomaly notification capabilities.

### 1.2 Scope
The enhancement adds machine operational status tracking and automated Discord notifications for inactive machines while maintaining full backward compatibility with the existing system.

### 1.3 System Context
- **Existing System**: Machine telemetry data collection and storage via Google Apps Script
- **New Components**: Operational status management, monitoring service, Discord notifications
- **Integration Points**: Google Sheets, Discord Webhook API, existing telemetry endpoints

---

## 2. Functional Requirements

### 2.1 Operational Status Management

#### FR-001: Operational Status Field
- **Description**: Add operational status selection to column K, row 1 of each machine sheet
- **Acceptance Criteria**:
  - Column K1 contains a dropdown with values: "Active", "Inactive", "Maintenance"
  - Default value is "Inactive" for new machines
  - Only manual modification allowed (no API changes)
  - Data validation prevents invalid entries

#### FR-002: Status Integration
- **Description**: Integrate operational status with existing sheet creation process
- **Acceptance Criteria**:
  - `createNewSheet()` function automatically adds status column
  - Status field is properly formatted and validated
  - Existing sheets remain unmodified until manual addition

### 2.2 Discord Notification System

#### FR-003: Stale Machine Detection
- **Description**: Detect machines marked as "Active" with no data updates for 10+ minutes
- **Acceptance Criteria**:
  - Monitor only machines with status = "Active"
  - Check data freshness based on GAS Time column
  - 10-minute threshold configurable via system properties

#### FR-004: Discord Alert Notifications
- **Description**: Send Discord webhook notifications for stale machines
- **Acceptance Criteria**:
  - Rich embed format with machine details
  - Include machine ID, last update time, elapsed duration
  - Error handling for webhook failures
  - Rate limiting compliance (30 requests/minute max)

#### FR-005: Duplicate Alert Prevention
- **Description**: Prevent repeated notifications for the same issue
- **Acceptance Criteria**:
  - Track alert history per machine
  - Maximum 1 alert per machine per 24-hour period
  - Reset alert state when machine recovers

#### FR-006: Recovery Notifications
- **Description**: Send recovery notifications when stale machines resume activity
- **Acceptance Criteria**:
  - Detect data resumption for previously stale machines
  - Send positive notification with recovery details
  - Clear alert state for recovered machines

### 2.3 System Management

#### FR-007: Configuration Management
- **Description**: Secure configuration storage and management
- **Acceptance Criteria**:
  - Discord webhook URL stored securely in PropertiesService
  - Monitoring enable/disable toggle
  - Configuration validation and error handling

#### FR-008: Monitoring Control
- **Description**: Automated monitoring execution and control
- **Acceptance Criteria**:
  - Time-based trigger execution (5-minute intervals)
  - Manual trigger installation/removal functions
  - Monitoring pause/resume capabilities

#### FR-009: Audit and Logging
- **Description**: Comprehensive logging and audit trail
- **Acceptance Criteria**:
  - Log all monitoring activities
  - Track notification history
  - Error logging with context information

---

## 3. Non-Functional Requirements

### 3.1 Compatibility Requirements

#### NFR-001: Backward Compatibility
- **Description**: Maintain full compatibility with existing system
- **Acceptance Criteria**:
  - All existing API endpoints unchanged
  - Machine data transmission format unchanged
  - No breaking changes to sheet structure

#### NFR-002: API Compatibility
- **Description**: Preserve existing API behavior
- **Acceptance Criteria**:
  - `doGet()` function behavior unchanged
  - `doPost()` function behavior unchanged
  - Response formats remain identical

### 3.2 Performance Requirements

#### NFR-003: Response Time
- **Description**: Minimize impact on existing API performance
- **Acceptance Criteria**:
  - API response time increase < 100ms
  - Monitoring operations execute within 30 seconds
  - No blocking operations during API calls

#### NFR-004: Scalability
- **Description**: Support monitoring of up to 100 machines
- **Acceptance Criteria**:
  - Efficient batch processing for status checks
  - Optimized sheet read operations
  - Memory usage within GAS limits

### 3.3 Reliability Requirements

#### NFR-005: Availability
- **Description**: High availability monitoring service
- **Acceptance Criteria**:
  - 99.5% monitoring uptime
  - Graceful failure handling
  - Automatic recovery from transient errors

#### NFR-006: Error Handling
- **Description**: Robust error handling and recovery
- **Acceptance Criteria**:
  - Network failure tolerance
  - Invalid data handling
  - Logging for all error conditions

### 3.4 Security Requirements

#### NFR-007: Data Protection
- **Description**: Secure handling of sensitive configuration
- **Acceptance Criteria**:
  - Webhook URLs encrypted in storage
  - No sensitive data in logs
  - Access control for configuration changes

### 3.5 Usability Requirements

#### NFR-008: Language Consistency
- **Description**: English-only user interface and messages
- **Acceptance Criteria**:
  - All UI text in English
  - Error messages in English
  - Log messages in English

---

## 4. System Interfaces

### 4.1 External Interfaces

#### INT-001: Discord Webhook API
- **Protocol**: HTTPS POST
- **Format**: JSON with Discord embed specification
- **Authentication**: Webhook URL-based
- **Rate Limits**: 30 requests per minute

#### INT-002: Google Sheets API
- **Access**: SpreadsheetApp service
- **Operations**: Read/write sheet data, format validation
- **Permissions**: Editor access to bound spreadsheet

### 4.2 Internal Interfaces

#### INT-003: Configuration Service
- **Storage**: PropertiesService (script-level properties)
- **Data Types**: String, Boolean
- **Access Pattern**: Read-heavy with occasional writes

#### INT-004: Trigger Service
- **Type**: Time-based triggers
- **Frequency**: 5-minute intervals
- **Management**: Create, delete, list operations

---

## 5. Data Requirements

### 5.1 Operational Status Data

```typescript
interface OperationalStatus {
  value: "Active" | "Inactive" | "Maintenance";
  location: "K1 cell of machine sheet";
  validation: "Dropdown with predefined values";
  default: "Inactive";
}
```

### 5.2 Alert History Data

```typescript
interface AlertHistory {
  machineId: string;
  lastAlertTime: string;
  isCurrentlyAlerting: boolean;
  lastRecoveryTime?: string;
  alertCount: number;
}
```

### 5.3 Configuration Data

```typescript
interface MonitoringConfig {
  discordWebhookUrl: string;
  monitoringEnabled: boolean;
  alertThresholdMinutes: number;
  alertCooldownHours: number;
}
```

---

## 6. Constraints and Assumptions

### 6.1 Technical Constraints
- Google Apps Script execution time limits (6 minutes maximum)
- PropertiesService storage limits (500KB total)
- Discord webhook rate limits (30 requests/minute)
- Spreadsheet API quota limits

### 6.2 Business Constraints
- No modification to machine-side data transmission
- Maintain existing user workflows
- English-only interface requirement

### 6.3 Assumptions
- Machines maintain consistent MachineID values
- Network connectivity to Discord available
- Spreadsheet structure remains consistent
- Time zone handling uses Asia/Tokyo

---

## 7. Risk Assessment

### 7.1 Technical Risks
- **API Rate Limiting**: Discord webhook limits may be exceeded
  - *Mitigation*: Implement request queuing and throttling
- **GAS Execution Limits**: Complex monitoring may timeout
  - *Mitigation*: Optimize queries and implement batching

### 7.2 Operational Risks
- **False Positives**: Network issues causing incorrect alerts
  - *Mitigation*: Implement retry logic and validation
- **Configuration Loss**: Properties service data corruption
  - *Mitigation*: Configuration backup and validation

---

## 8. Acceptance Criteria

### 8.1 System Integration Tests
- [ ] Existing API functionality unchanged
- [ ] New machine sheets include operational status
- [ ] Status changes do not affect telemetry data

### 8.2 Monitoring Function Tests
- [ ] Active machines monitored correctly
- [ ] Stale detection within 5 minutes of threshold
- [ ] Notifications sent to Discord successfully

### 8.3 Error Handling Tests
- [ ] Invalid webhook URLs handled gracefully
- [ ] Network failures do not crash system
- [ ] Malformed data does not cause errors

### 8.4 Performance Tests
- [ ] API response times within acceptable limits
- [ ] Monitoring completes within 30 seconds
- [ ] Memory usage within GAS constraints

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **GAS** | Google Apps Script |
| **Stale Machine** | Machine with operational status "Active" but no data updates for 10+ minutes |
| **Webhook** | HTTP callback mechanism for Discord notifications |
| **PropertiesService** | GAS service for persistent key-value storage |
| **Alert Cooldown** | Period during which duplicate alerts are suppressed |

---

*This document serves as the foundation for the Discord monitoring system implementation. All requirements must be validated against this specification during development and testing phases.*