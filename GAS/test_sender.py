"""
Google Apps Script WebApp Test Data Sender (v2.0.0)
Made by Shintaro Matsumoto
"""

import json
import requests
import time
from datetime import datetime
from typing import Dict, Any


class GASTestSender:
    def __init__(self, webapp_url: str):
        """
        Initialize test sender class
        
        Args:
            webapp_url: Google Apps Script WebApp URL
        """
        self.webapp_url = webapp_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'GAS-Test-Sender/1.0'
        })
    
    def create_test_data(self, machine_id: str = "00453", data_type: str = "HK") -> Dict[str, Any]:
        """
        Generate test data
        
        Args:
            machine_id: Machine ID
            data_type: Data type
            
        Returns:
            Test data dictionary
        """
        current_time = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        
        return {
            "DataType": data_type,
            "MachineID": machine_id,
            "MachineTime": current_time,
            "GPS": {
                "LAT": 34.124125,
                "LNG": 153.131241,
                "ALT": 342.5,
                "SAT": 43
            },
            "BAT": 3.45,
            "CMT": "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE"
        }
    
    def send_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send data to GAS WebApp
        
        Args:
            data: Data to send
            
        Returns:
            Response dictionary
        """
        try:
            print(f"Sending data: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            response = self.session.post(
                self.webapp_url,
                json=data,
                timeout=30
            )
            
            print(f"HTTP Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "status": "error",
                    "message": f"HTTP {response.status_code}: {response.text}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "status": "error",
                "message": "Request timeout"
            }
        except requests.exceptions.ConnectionError:
            return {
                "status": "error",
                "message": "Connection error"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }
    
    def test_single_send(self, machine_id: str = "00453"):
        """
        Single data transmission test
        
        Args:
            machine_id: Machine ID
        """
        print(f"\n=== Single Data Send Test (Machine ID: {machine_id}) ===")
        
        test_data = self.create_test_data(machine_id)
        result = self.send_data(test_data)
        
        if result.get("status") == "success":
            print("✓ Data send success")
            print(f"  - Sheet name: {result.get('sheetName')}")
            print(f"  - Row number: {result.get('rowNumber')}")
        else:
            print(f"✗ Data send failed: {result.get('message')}")
    
    def test_multiple_sends(self, machine_id: str = "00453", count: int = 5, interval: float = 2.0):
        """
        Multiple data consecutive send test
        
        Args:
            machine_id: Machine ID
            count: Number of sends
            interval: Send interval (seconds)
        """
        print(f"\n=== Multiple Data Send Test (Machine ID: {machine_id}, {count} times, {interval}s interval) ===")
        
        success_count = 0
        
        for i in range(count):
            print(f"\n--- Send {i+1}/{count} ---")
            
            test_data = self.create_test_data(machine_id)
            # Slightly change position each time
            test_data["GPS"]["LAT"] += i * 0.001
            test_data["GPS"]["LNG"] += i * 0.001
            test_data["GPS"]["ALT"] += i * 10
            test_data["BAT"] -= i * 0.1
            
            result = self.send_data(test_data)
            
            if result.get("status") == "success":
                success_count += 1
                print(f"✓ Send success ({i+1}/{count})")
            else:
                print(f"✗ Send failed: {result.get('message')}")
            
            if i < count - 1:  # Wait except for the last send
                time.sleep(interval)
        
        print(f"\n=== Send Results ===")
        print(f"Success: {success_count}/{count}")
        print(f"Failed: {count - success_count}/{count}")
    
    def test_multiple_machines(self, machine_ids: list = None, interval: float = 1.0):
        """
        Multiple machines send test
        
        Args:
            machine_ids: List of machine IDs
            interval: Send interval (seconds)
        """
        if machine_ids is None:
            machine_ids = ["00453", "00454", "00455"]
        
        print(f"\n=== Multiple Machines Send Test (Machine count: {len(machine_ids)}) ===")
        
        for machine_id in machine_ids:
            print(f"\n--- Machine {machine_id} ---")
            
            test_data = self.create_test_data(machine_id)
            # Change position for each machine
            id_num = int(machine_id) if machine_id.isdigit() else hash(machine_id) % 1000
            test_data["GPS"]["LAT"] += (id_num % 100) * 0.01
            test_data["GPS"]["LNG"] += (id_num % 100) * 0.01
            
            result = self.send_data(test_data)
            
            if result.get("status") == "success":
                print(f"✓ Machine {machine_id} send success")
            else:
                print(f"✗ Machine {machine_id} send failed: {result.get('message')}")
            
            time.sleep(interval)


def main():
    """
    Main function
    """
    # TODO: Replace with actual GAS WebApp URL
    webapp_url = "https://script.google.com/macros/s/AKfycbys_1sl065_wV_0RusA_aIOxtA3HUuqizsItE7q8g6Qq9vyrd836MtfSKtc5oRh0PRCcA/exec"
    
    print("Google Apps Script WebApp Test Sender Tool")
    print("=" * 50)
    print(f"Target URL: {webapp_url}")
    print()
    
    # Warning if URL is not set
    if "YOUR_SCRIPT_ID" in webapp_url:
        print("⚠️  Warning: WebApp URL is not set")
        print("   Please publish WebApp on script.google.com and set the URL")
        print("   Example: https://script.google.com/macros/s/AKfycbx.../exec")
        return
    
    sender = GASTestSender(webapp_url)
    
    try:
        # Test menu
        while True:
            print("\nTest Menu:")
            print("1. Single Data Send Test")
            print("2. Multiple Data Send Test")
            print("3. Multiple Machines Send Test")
            print("4. Exit")
            
            choice = input("\nPlease select (1-4): ").strip()
            
            if choice == "1":
                machine_id = input("Machine ID (default: 00453): ").strip() or "00453"
                sender.test_single_send(machine_id)
            
            elif choice == "2":
                machine_id = input("Machine ID (default: 00453): ").strip() or "00453"
                count = int(input("Send count (default: 5): ").strip() or "5")
                interval = float(input("Send interval (seconds) (default: 2.0): ").strip() or "2.0")
                sender.test_multiple_sends(machine_id, count, interval)
            
            elif choice == "3":
                ids_input = input("Machine IDs (comma separated) (default: 00453,00454,00455): ").strip()
                if ids_input:
                    machine_ids = [id.strip() for id in ids_input.split(",")]
                else:
                    machine_ids = ["00453", "00454", "00455"]
                interval = float(input("Send interval (seconds) (default: 1.0): ").strip() or "1.0")
                sender.test_multiple_machines(machine_ids, interval)
            
            elif choice == "4":
                print("Exiting test")
                break
            
            else:
                print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\n\nTest was interrupted")
    except Exception as e:
        print(f"\nError occurred: {e}")


if __name__ == "__main__":
    main()