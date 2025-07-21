
#!/usr/bin/env python3
"""
Discord Monitoring System Test Script
テレメトリデータ送信とDiscord監視機能のテストスクリプト
"""

import requests
import json
import time
import datetime
from typing import Dict, Any
import random

# GAS WebApp URL (実際のURLに変更してください)
GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzDduh5Bb4BEKfMfTfL0JZFrp6GnOptSUTTGorXkC1F-OnebhFMeRn6LNK6qjUH4giohQ/exec"

class TelemetryTester:
    def __init__(self, gas_url: str):
        self.gas_url = gas_url
        self.session = requests.Session()
        
    def create_telemetry_data(self, machine_id: str, timestamp: str = None) -> Dict[str, Any]:
        """テレメトリデータを作成（example_json/telemetry_data.json形式に厳守）"""
        if not timestamp:
            timestamp = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")
            
        # サンプルGPS座標（日本周辺）
        base_lat = 34.124125 + random.uniform(-0.01, 0.01)
        base_lng = 153.131241 + random.uniform(-0.01, 0.01)
        
        return {
            "DataType": "HK",
            "MachineID": machine_id,
            "MachineTime": timestamp,
            "GPS": {
                "LAT": base_lat,
                "LNG": base_lng,
                "ALT": 342.5 + random.uniform(-50, 50),
                "SAT": random.randint(4, 12)
            },
            "BAT": round(random.uniform(3.0, 4.2), 2),
            "CMT": "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE"
        }
    
    def send_telemetry(self, data: Dict[str, Any]) -> bool:
        """テレメトリデータをGASに送信"""
        try:
            response = self.session.post(
                self.gas_url,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('status') == 'success':
                    print(f"✓ Data sent successfully for {data['MachineID']}: {result.get('message')}")
                    return True
                else:
                    print(f"✗ Error response for {data['MachineID']}: {result.get('message')}")
                    return False
            else:
                print(f"✗ HTTP Error {response.status_code} for {data['MachineID']}: {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ Exception sending data for {data['MachineID']}: {str(e)}")
            return False
    
    def test_single_machine_data(self, machine_id: str = "00453"):
        """単一機体のデータ送信テスト"""
        print(f"\n=== Single Machine Data Test ({machine_id}) ===")
        
        data = self.create_telemetry_data(machine_id)
        print(f"Sending data: {json.dumps(data, indent=2)}")
        
        success = self.send_telemetry(data)
        return success
    
    def test_multiple_machines(self, machine_ids: list, count: int = 3):
        """複数機体のデータ送信テスト"""
        print(f"\n=== Multiple Machines Test ({len(machine_ids)} machines, {count} data points each) ===")
        
        success_count = 0
        total_count = 0
        
        for machine_id in machine_ids:
            print(f"\nTesting Machine {machine_id}:")
            for i in range(count):
                data = self.create_telemetry_data(machine_id)
                if self.send_telemetry(data):
                    success_count += 1
                total_count += 1
                
                # 短い間隔を空ける
                time.sleep(0.5)
        
        print(f"\nResults: {success_count}/{total_count} successful")
        return success_count == total_count
    
    def simulate_machine_offline(self, machine_id: str, offline_minutes: int = 12):
        """機体オフラインシミュレーション"""
        print(f"\n=== Machine Offline Simulation ({machine_id}) ===")
        print(f"1. Sending initial data")
        
        # 初期データ送信
        data = self.create_telemetry_data(machine_id)
        self.send_telemetry(data)
        
        print(f"2. Machine {machine_id} will be offline for {offline_minutes} minutes")
        print(f"   This should trigger a Discord alert after 10 minutes")
        print(f"   Current time: {datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S')}")
        print(f"   Expected alert time: {(datetime.datetime.now() + datetime.timedelta(minutes=10)).strftime('%Y/%m/%d %H:%M:%S')}")
        
        # 指定時間待機（実際のテストでは短縮可能）
        if offline_minutes > 0:
            print(f"3. Waiting {offline_minutes} minutes...")
            for minute in range(offline_minutes):
                time.sleep(60)  # 1分待機
                remaining = offline_minutes - minute - 1
                if remaining > 0:
                    print(f"   {remaining} minutes remaining...")
        
        print(f"4. Resuming data transmission")
        # 復旧データ送信
        recovery_data = self.create_telemetry_data(machine_id)
        self.send_telemetry(recovery_data)
        
        print(f"   Recovery data sent at: {datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S')}")
        print("   This should trigger a recovery notification")
    
    def create_test_machines(self, machine_ids: list):
        """テスト用機体シートを作成"""
        print(f"\n=== Creating Test Machines ===")
        
        for machine_id in machine_ids:
            register_data = {
                "action": "registerMachine",
                "MachineID": machine_id
            }
            
            try:
                response = self.session.post(
                    self.gas_url,
                    json=register_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✓ Machine {machine_id} registered: {result.get('message', 'Success')}")
                else:
                    print(f"✗ Failed to register machine {machine_id}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"✗ Exception registering machine {machine_id}: {str(e)}")
        
        print("\nNote: Remember to set Operational Status to 'Active' in column K for monitoring")

def main():
    """メイン実行関数"""
    print("Discord Monitoring System Test Script")
    print("=====================================")
    
    # GAS URLの確認
    if GAS_WEBAPP_URL == "YOUR_GAS_WEBAPP_URL_HERE":
        print("⚠ Please set the correct GAS_WEBAPP_URL in this script first")
        return
    
    tester = TelemetryTester(GAS_WEBAPP_URL)
    
    # テスト用機体ID
    test_machines = ["00453", "00454", "00455"]
    
    print(f"Using GAS URL: {GAS_WEBAPP_URL}")
    
    while True:
        print("\n" + "="*50)
        print("Test Options:")
        print("1. Create test machines (register sheets)")
        print("2. Send single machine data")
        print("3. Send multiple machines data")
        print("4. Simulate machine offline (Discord alert test)")
        print("5. Continuous data sending (for testing)")
        print("0. Exit")
        
        choice = input("\nEnter choice (0-5): ").strip()
        
        if choice == "0":
            print("Exiting...")
            break
        elif choice == "1":
            tester.create_test_machines(test_machines)
        elif choice == "2":
            machine_id = input(f"Enter Machine ID (default: {test_machines[0]}): ").strip() or test_machines[0]
            tester.test_single_machine_data(machine_id)
        elif choice == "3":
            tester.test_multiple_machines(test_machines)
        elif choice == "4":
            machine_id = input(f"Enter Machine ID (default: {test_machines[0]}): ").strip() or test_machines[0]
            try:
                offline_min = int(input("Offline minutes (default: 12): ").strip() or "12")
            except ValueError:
                offline_min = 12
            tester.simulate_machine_offline(machine_id, offline_min)
        elif choice == "5":
            machine_id = input(f"Enter Machine ID (default: {test_machines[0]}): ").strip() or test_machines[0]
            try:
                interval = int(input("Interval in seconds (default: 30): ").strip() or "30")
            except ValueError:
                interval = 30
            
            print(f"Sending continuous data for {machine_id} every {interval} seconds")
            print("Press Ctrl+C to stop...")
            
            try:
                count = 0
                while True:
                    count += 1
                    data = tester.create_telemetry_data(machine_id)
                    success = tester.send_telemetry(data)
                    print(f"[{count}] {'✓' if success else '✗'} {datetime.datetime.now().strftime('%H:%M:%S')}")
                    time.sleep(interval)
            except KeyboardInterrupt:
                print("\nStopped by user")
        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()