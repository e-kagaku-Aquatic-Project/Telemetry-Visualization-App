#!/usr/bin/env python3
"""
Discord WebHook Notification System Test Suite
Tests the notification functionality and new API endpoints
"""

import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sys

class NotificationSystemTester:
    def __init__(self, gas_endpoint: str):
        """
        Initialize the notification system tester
        
        Args:
            gas_endpoint: The Google Apps Script WebApp URL
        """
        self.gas_endpoint = gas_endpoint.rstrip('/')
        self.test_machine_id = f"TEST_{int(time.time())}"
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def test_connection(self) -> bool:
        """Test basic connection to GAS endpoint"""
        try:
            self.log("Testing basic connection to GAS endpoint...")
            response = self.session.get(f"{self.gas_endpoint}?action=getMachineList")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log("✅ Connection successful")
                    return True
                else:
                    self.log(f"❌ API returned error: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"❌ HTTP error: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Connection failed: {e}", "ERROR")
            return False
    
    def test_new_api_endpoints(self) -> bool:
        """Test new API endpoints added for notification system"""
        endpoints = [
            "getMonitoringStats",
            "getMachineStats", 
            "getConfigStatus"
        ]
        
        all_passed = True
        
        for endpoint in endpoints:
            try:
                self.log(f"Testing endpoint: {endpoint}")
                response = self.session.get(f"{self.gas_endpoint}?action={endpoint}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        self.log(f"✅ {endpoint} working")
                        self.log(f"   Response keys: {list(data.keys())}")
                    else:
                        self.log(f"❌ {endpoint} returned error: {data.get('message')}", "ERROR")
                        all_passed = False
                else:
                    self.log(f"❌ {endpoint} HTTP error: {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ {endpoint} failed: {e}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def create_test_machine(self) -> bool:
        """Create a test machine for notification testing"""
        try:
            self.log(f"Creating test machine: {self.test_machine_id}")
            
            registration_data = {
                "action": "registerMachine",
                "MachineID": self.test_machine_id,
                "metadata": {
                    "type": "test_notification",
                    "created": datetime.now().isoformat(),
                    "purpose": "Discord notification testing"
                }
            }
            
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(registration_data)
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log(f"✅ Test machine {self.test_machine_id} created")
                    return True
                else:
                    self.log(f"❌ Failed to create test machine: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"❌ HTTP error creating test machine: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating test machine: {e}", "ERROR")
            return False
    
    def send_test_telemetry(self, minutes_ago: int = 0) -> bool:
        """Send test telemetry data"""
        try:
            # Calculate timestamp
            timestamp = datetime.now() - timedelta(minutes=minutes_ago)
            machine_time = timestamp.strftime("%Y/%m/%d %H:%M:%S")
            
            telemetry_data = {
                "DataType": "TEST",
                "MachineID": self.test_machine_id,
                "MachineTime": machine_time,
                "GPS": {
                    "LAT": 35.6762 + (hash(self.test_machine_id) % 100) * 0.0001,
                    "LNG": 139.6503 + (hash(self.test_machine_id) % 100) * 0.0001,
                    "ALT": 10 + (hash(self.test_machine_id) % 50),
                    "SAT": 8 + (hash(self.test_machine_id) % 8)
                },
                "BAT": 3.0 + (hash(self.test_machine_id) % 100) * 0.012,
                "CMT": f"Test telemetry data - {minutes_ago} minutes ago"
            }
            
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(telemetry_data)
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log(f"✅ Telemetry sent (timestamp: {machine_time})")
                    return True
                else:
                    self.log(f"❌ Failed to send telemetry: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"❌ HTTP error sending telemetry: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error sending telemetry: {e}", "ERROR")
            return False
    
    def set_machine_active_status(self, is_active: bool) -> bool:
        """Set machine active status"""
        try:
            self.log(f"Setting machine {self.test_machine_id} active status to: {is_active}")
            
            status_data = {
                "action": "setActiveStatus",
                "machineId": self.test_machine_id,
                "isActive": is_active
            }
            
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(status_data)
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log(f"✅ Active status set to {is_active}")
                    return True
                else:
                    self.log(f"❌ Failed to set active status: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"❌ HTTP error setting active status: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error setting active status: {e}", "ERROR")
            return False
    
    def test_discord_notifications(self) -> bool:
        """Test Discord notification functionality"""
        try:
            self.log("Testing Discord notification functionality...")
            
            # Test different notification types
            notification_types = ["connection", "lost", "reminder", "recovery"]
            
            for notification_type in notification_types:
                self.log(f"Testing {notification_type} notification...")
                
                test_data = {
                    "action": "testNotification",
                    "testType": notification_type
                }
                
                response = self.session.post(
                    self.gas_endpoint,
                    headers={"Content-Type": "application/json"},
                    data=json.dumps(test_data)
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        self.log(f"✅ {notification_type} notification sent")
                    else:
                        self.log(f"❌ {notification_type} notification failed: {data.get('message')}", "ERROR")
                        return False
                else:
                    self.log(f"❌ HTTP error for {notification_type}: {response.status_code}", "ERROR")
                    return False
                
                # Wait between notifications to avoid rate limits
                time.sleep(2)
            
            return True
            
        except Exception as e:
            self.log(f"❌ Error testing Discord notifications: {e}", "ERROR")
            return False
    
    def check_machine_monitoring(self) -> bool:
        """Check machine monitoring status"""
        try:
            self.log("Checking machine monitoring status...")
            
            # Manual machine check
            check_data = {
                "action": "checkMachine",
                "machineId": self.test_machine_id
            }
            
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(check_data)
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log(f"✅ Machine check completed")
                    self.log(f"   Machine status: {data.get('machine_status', {})}")
                    return True
                else:
                    self.log(f"❌ Machine check failed: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"❌ HTTP error in machine check: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error checking machine monitoring: {e}", "ERROR")
            return False
    
    def simulate_timeout_scenario(self) -> bool:
        """Simulate a timeout scenario for testing"""
        try:
            self.log("🎭 Simulating timeout scenario...")
            
            # Step 1: Send old telemetry data (15 minutes ago)
            self.log("Step 1: Sending old telemetry data (15 minutes ago)")
            if not self.send_test_telemetry(minutes_ago=15):
                return False
            
            # Step 2: Set machine to active
            self.log("Step 2: Setting machine to active")
            if not self.set_machine_active_status(True):
                return False
            
            # Step 3: Trigger manual check
            self.log("Step 3: Triggering manual timeout check")
            if not self.check_machine_monitoring():
                return False
            
            self.log("✅ Timeout scenario simulation completed")
            self.log("   Check Discord for signal lost notification!")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Error in timeout scenario: {e}", "ERROR")
            return False
    
    def simulate_recovery_scenario(self) -> bool:
        """Simulate a recovery scenario"""
        try:
            self.log("🎭 Simulating recovery scenario...")
            
            # Step 1: Send fresh telemetry data
            self.log("Step 1: Sending fresh telemetry data")
            if not self.send_test_telemetry(minutes_ago=0):
                return False
            
            # Step 2: Trigger manual check
            self.log("Step 2: Triggering manual check for recovery")
            if not self.check_machine_monitoring():
                return False
            
            self.log("✅ Recovery scenario simulation completed")
            self.log("   Check Discord for signal recovery notification!")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Error in recovery scenario: {e}", "ERROR")
            return False
    
    def cleanup_test_machine(self) -> bool:
        """Clean up test machine (set to inactive)"""
        try:
            self.log(f"Cleaning up test machine: {self.test_machine_id}")
            
            # Set machine to inactive
            if self.set_machine_active_status(False):
                self.log("✅ Test machine set to inactive")
                return True
            else:
                return False
                
        except Exception as e:
            self.log(f"❌ Error cleaning up: {e}", "ERROR")
            return False
    
    def run_comprehensive_test(self) -> bool:
        """Run comprehensive test suite"""
        self.log("🚀 Starting comprehensive notification system test...")
        
        tests = [
            ("Connection Test", self.test_connection),
            ("New API Endpoints", self.test_new_api_endpoints),
            ("Discord Notifications", self.test_discord_notifications),
            ("Create Test Machine", self.create_test_machine),
            ("Timeout Scenario", self.simulate_timeout_scenario),
            ("Recovery Scenario", self.simulate_recovery_scenario),
            ("Cleanup", self.cleanup_test_machine)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                if test_func():
                    self.log(f"✅ {test_name} PASSED")
                    passed += 1
                else:
                    self.log(f"❌ {test_name} FAILED")
            except Exception as e:
                self.log(f"❌ {test_name} ERROR: {e}", "ERROR")
            
            # Wait between tests
            time.sleep(1)
        
        self.log(f"\n🎯 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed! Notification system is working correctly.")
            return True
        else:
            self.log("⚠️ Some tests failed. Please check the logs above.")
            return False

def main():
    """Main function"""
    # GAS WebApp URL - Update this with your actual deployed URL
    gas_endpoint = "https://script.google.com/macros/s/AKfycbxWyEBGpdm09R5UdVqiYUrUiZ1FbeB4PU9KKKJJjLhI__Ged3_5oSfmRjLaBx2KHy4QUQ/exec"
    
    # You can still override with command line argument if provided
    if len(sys.argv) == 2:
        gas_endpoint = sys.argv[1]
    
    # Check if URL needs to be updated
    if "YOUR_SCRIPT_ID" in gas_endpoint:
        print("❌ Please update the gas_endpoint URL in the script with your actual GAS WebApp URL")
        print("   Look for: gas_endpoint = \"https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec\"")
        print("   Replace YOUR_SCRIPT_ID with your actual script ID")
        print()
        print("Alternative: Run with URL as argument:")
        print("   python3 test_notification_system.py https://script.google.com/macros/s/.../exec")
        sys.exit(1)
    
    print("Discord WebHook Notification System Test Suite")
    print("=" * 50)
    print(f"Testing endpoint: {gas_endpoint}")
    print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    tester = NotificationSystemTester(gas_endpoint)
    
    try:
        success = tester.run_comprehensive_test()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
        tester.cleanup_test_machine()
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        tester.cleanup_test_machine()
        sys.exit(1)

if __name__ == "__main__":
    main()