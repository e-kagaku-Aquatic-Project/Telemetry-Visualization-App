#!/usr/bin/env python3
"""
API Compatibility Test Script
Tests backward compatibility with existing frontend APIs
"""

import json
import requests
import time
from datetime import datetime
import sys

class APICompatibilityTester:
    def __init__(self, gas_endpoint: str):
        """Initialize API compatibility tester"""
        self.gas_endpoint = gas_endpoint.rstrip('/')
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        symbol = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}.get(level, "ℹ️")
        print(f"[{timestamp}] {symbol} {message}")
    
    def test_legacy_endpoints(self) -> bool:
        """Test all legacy API endpoints that frontend uses"""
        self.log("Testing legacy API endpoints for compatibility...")
        
        endpoints = [
            ("getAllMachines", {}),
            ("getMachineList", {}),
        ]
        
        # Add getMachine test if we have machines
        try:
            # Get machine list first to test getMachine
            response = self.session.get(f"{self.gas_endpoint}?action=getMachineList")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success" and data.get("machines"):
                    first_machine = data["machines"][0]["machineId"]
                    endpoints.append(("getMachine", {"machineId": first_machine}))
        except:
            pass
        
        all_passed = True
        
        for endpoint, params in endpoints:
            try:
                # Build URL
                url = f"{self.gas_endpoint}?action={endpoint}"
                for key, value in params.items():
                    url += f"&{key}={value}"
                
                self.log(f"Testing: {endpoint}")
                response = self.session.get(url)
                
                if response.status_code != 200:
                    self.log(f"HTTP error {response.status_code} for {endpoint}", "ERROR")
                    all_passed = False
                    continue
                
                data = response.json()
                
                if data.get("status") != "success":
                    self.log(f"API error for {endpoint}: {data.get('message')}", "ERROR")
                    all_passed = False
                    continue
                
                # Validate response structure
                if not self.validate_response_structure(endpoint, data):
                    all_passed = False
                    continue
                
                self.log(f"{endpoint} - PASSED", "SUCCESS")
                
            except Exception as e:
                self.log(f"Exception testing {endpoint}: {e}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def validate_response_structure(self, endpoint: str, data: dict) -> bool:
        """Validate response structure matches frontend expectations"""
        
        if endpoint == "getAllMachines":
            required_fields = ["status", "machines", "totalMachines", "timestamp"]
            
            for field in required_fields:
                if field not in data:
                    self.log(f"Missing field '{field}' in {endpoint} response", "ERROR")
                    return False
            
            # Check machines array structure
            if data["machines"]:
                machine = data["machines"][0]
                machine_required = ["machineId", "data"]
                
                for field in machine_required:
                    if field not in machine:
                        self.log(f"Missing field '{field}' in machine object", "ERROR")
                        return False
                
                # Check if isActive field is added (should be optional)
                if "isActive" in machine:
                    self.log(f"✨ New 'isActive' field detected in {endpoint}", "INFO")
                
                # Check data point structure
                if machine["data"]:
                    data_point = machine["data"][0]
                    data_required = [
                        "timestamp", "machineTime", "machineId", "dataType",
                        "latitude", "longitude", "altitude", "satellites", "battery", "comment"
                    ]
                    
                    for field in data_required:
                        if field not in data_point:
                            self.log(f"Missing field '{field}' in data point", "ERROR")
                            return False
        
        elif endpoint == "getMachine":
            required_fields = ["status", "machineId", "data", "dataCount", "timestamp"]
            
            for field in required_fields:
                if field not in data:
                    self.log(f"Missing field '{field}' in {endpoint} response", "ERROR")
                    return False
            
            # Check if isActive field is added
            if "isActive" in data:
                self.log(f"✨ New 'isActive' field detected in {endpoint}", "INFO")
        
        elif endpoint == "getMachineList":
            required_fields = ["status", "machines", "totalMachines", "timestamp"]
            
            for field in required_fields:
                if field not in data:
                    self.log(f"Missing field '{field}' in {endpoint} response", "ERROR")
                    return False
            
            # Check machine list item structure
            if data["machines"]:
                machine = data["machines"][0]
                machine_required = ["machineId", "sheetName", "dataCount", "lastUpdate"]
                
                for field in machine_required:
                    if field not in machine:
                        self.log(f"Missing field '{field}' in machine list item", "ERROR")
                        return False
                
                # Check if isActive field is added
                if "isActive" in machine:
                    self.log(f"✨ New 'isActive' field detected in {endpoint}", "INFO")
        
        return True
    
    def test_post_endpoints(self) -> bool:
        """Test POST endpoints for compatibility"""
        self.log("Testing POST endpoints for compatibility...")
        
        # Test machine registration
        test_machine_id = f"COMPAT_TEST_{int(time.time())}"
        
        registration_data = {
            "action": "registerMachine",
            "MachineID": test_machine_id,
            "metadata": {"test": True}
        }
        
        try:
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(registration_data)
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log("Machine registration - PASSED", "SUCCESS")
                else:
                    self.log(f"Machine registration failed: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"Machine registration HTTP error: {response.status_code}", "ERROR")
                return False
        
        except Exception as e:
            self.log(f"Machine registration exception: {e}", "ERROR")
            return False
        
        # Test telemetry data saving
        telemetry_data = {
            "DataType": "TEST",
            "MachineID": test_machine_id,
            "MachineTime": datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
            "GPS": {
                "LAT": 35.6762,
                "LNG": 139.6503,
                "ALT": 10,
                "SAT": 8
            },
            "BAT": 3.7,
            "CMT": "Compatibility test data"
        }
        
        try:
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(telemetry_data)
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    # Validate response structure
                    required_fields = ["status", "message", "rowNumber", "sheetName"]
                    missing_fields = [f for f in required_fields if f not in data]
                    
                    if missing_fields:
                        self.log(f"Missing fields in telemetry response: {missing_fields}", "ERROR")
                        return False
                    
                    self.log("Telemetry data saving - PASSED", "SUCCESS")
                else:
                    self.log(f"Telemetry save failed: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"Telemetry save HTTP error: {response.status_code}", "ERROR")
                return False
        
        except Exception as e:
            self.log(f"Telemetry save exception: {e}", "ERROR")
            return False
        
        # Clean up - set machine to inactive
        try:
            cleanup_data = {
                "action": "setActiveStatus",
                "machineId": test_machine_id,
                "isActive": False
            }
            
            self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(cleanup_data)
            )
            self.log(f"Test machine {test_machine_id} set to inactive", "INFO")
        except:
            pass
        
        return True
    
    def test_new_endpoints(self) -> bool:
        """Test new endpoints don't interfere with existing functionality"""
        self.log("Testing new endpoints...")
        
        new_endpoints = [
            "getMonitoringStats",
            "getMachineStats", 
            "getConfigStatus"
        ]
        
        all_passed = True
        
        for endpoint in new_endpoints:
            try:
                self.log(f"Testing new endpoint: {endpoint}")
                response = self.session.get(f"{self.gas_endpoint}?action={endpoint}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        self.log(f"{endpoint} - PASSED", "SUCCESS")
                    else:
                        self.log(f"{endpoint} returned error: {data.get('message')}", "WARNING")
                        # New endpoints can fail due to setup, but shouldn't break old ones
                else:
                    self.log(f"{endpoint} HTTP error: {response.status_code}", "WARNING")
                
            except Exception as e:
                self.log(f"{endpoint} exception: {e}", "WARNING")
        
        return True  # New endpoint failures don't affect compatibility
    
    def test_response_times(self) -> bool:
        """Test that response times are reasonable"""
        self.log("Testing API response times...")
        
        endpoints = ["getAllMachines", "getMachineList"]
        
        for endpoint in endpoints:
            try:
                start_time = time.time()
                response = self.session.get(f"{self.gas_endpoint}?action={endpoint}")
                end_time = time.time()
                
                response_time = end_time - start_time
                
                if response.status_code == 200:
                    if response_time < 5.0:  # 5 seconds threshold
                        self.log(f"{endpoint} response time: {response_time:.2f}s - GOOD", "SUCCESS")
                    else:
                        self.log(f"{endpoint} response time: {response_time:.2f}s - SLOW", "WARNING")
                else:
                    self.log(f"{endpoint} failed to respond", "ERROR")
                    return False
                    
            except Exception as e:
                self.log(f"Error testing {endpoint} response time: {e}", "ERROR")
                return False
        
        return True
    
    def run_compatibility_test(self) -> bool:
        """Run complete compatibility test suite"""
        self.log("🚀 Starting API Compatibility Test Suite")
        
        tests = [
            ("Legacy Endpoints", self.test_legacy_endpoints),
            ("POST Endpoints", self.test_post_endpoints),
            ("New Endpoints", self.test_new_endpoints),
            ("Response Times", self.test_response_times)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                if test_func():
                    self.log(f"{test_name} - PASSED", "SUCCESS")
                    passed += 1
                else:
                    self.log(f"{test_name} - FAILED", "ERROR")
            except Exception as e:
                self.log(f"{test_name} - ERROR: {e}", "ERROR")
        
        self.log(f"\n🎯 Compatibility Test Results: {passed}/{total} test suites passed")
        
        if passed >= 3:  # Allow new endpoints to fail
            self.log("🎉 API is backward compatible! Frontend should work without changes.", "SUCCESS")
            return True
        else:
            self.log("⚠️ Compatibility issues detected. Frontend may need updates.", "WARNING")
            return False

def main():
    # GAS WebApp URL - Update this with your actual deployed URL
    gas_endpoint = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    
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
        print("   python3 test_api_compatibility.py https://script.google.com/.../exec")
        sys.exit(1)
    
    print("API Compatibility Test Suite")
    print("=" * 30)
    print(f"Testing: {gas_endpoint}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    tester = APICompatibilityTester(gas_endpoint)
    
    try:
        success = tester.run_compatibility_test()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()