#!/usr/bin/env python3
"""
Quick Test Script for Discord Monitoring System
Discord監視システムの簡単テストスクリプト
"""

import requests
import json
import datetime
import time

# ===========================================
# 設定 (実際の値に変更してください)
# ===========================================
GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzDduh5Bb4BEKfMfTfL0JZFrp6GnOptSUTTGorXkC1F-OnebhFMeRn6LNK6qjUH4giohQ/exec"
TEST_MACHINE_ID = "QUICKTEST"

def send_test_data(machine_id: str, gas_url: str):
    """テストデータ送信（example_json/telemetry_data.json形式厳守）"""
    
    # 現在時刻
    current_time = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")
    
    # テストデータ（完全にexample_json準拠）
    test_data = {
        "DataType": "HK",
        "MachineID": machine_id,
        "MachineTime": current_time,
        "GPS": {
            "LAT": 34.124125,
            "LNG": 153.131241,
            "ALT": 342.5,
            "SAT": 8
        },
        "BAT": 3.85,
        "CMT": "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE"
    }
    
    try:
        print(f"Sending data for {machine_id}...")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            gas_url,
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                print(f"✓ SUCCESS: {result.get('message')}")
                print(f"  Sheet: {result.get('sheetName')}")
                print(f"  Row: {result.get('rowNumber')}")
                return True
            else:
                print(f"✗ ERROR: {result.get('message')}")
                return False
        else:
            print(f"✗ HTTP ERROR: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ EXCEPTION: {str(e)}")
        return False

def create_test_machine(machine_id: str, gas_url: str):
    """テスト機体シート作成"""
    register_data = {
        "action": "registerMachine",
        "MachineID": machine_id
    }
    
    try:
        print(f"Creating test machine sheet for {machine_id}...")
        
        response = requests.post(
            gas_url,
            json=register_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                print(f"✓ Machine sheet created: {result.get('sheetName')}")
                print("  📝 Remember: Set column K1 to 'Active' for monitoring")
                return True
            else:
                print(f"ℹ Machine registration result: {result.get('message')}")
                return True  # Already exists is OK
        else:
            print(f"✗ HTTP ERROR: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ EXCEPTION: {str(e)}")
        return False

def quick_offline_test(machine_id: str, gas_url: str, offline_minutes: int = 12):
    """クイックオフラインテスト"""
    print(f"\n🧪 QUICK OFFLINE TEST for {machine_id}")
    print("="*50)
    
    # Step 1: 機体作成
    print("Step 1: Creating machine sheet...")
    create_test_machine(machine_id, gas_url)
    
    # Step 2: 初期データ送信
    print("\nStep 2: Sending initial data...")
    if not send_test_data(machine_id, gas_url):
        print("❌ Failed to send initial data. Check GAS URL and permissions.")
        return False
    
    # Step 3: オフライン待機
    print(f"\nStep 3: Machine going offline for {offline_minutes} minutes...")
    print(f"  Current time: {datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S')}")
    print(f"  Expected Discord alert at: {(datetime.datetime.now() + datetime.timedelta(minutes=10)).strftime('%Y/%m/%d %H:%M:%S')}")
    
    if offline_minutes > 0:
        print(f"  ⏳ Waiting {offline_minutes} minutes...")
        for i in range(offline_minutes):
            remaining = offline_minutes - i
            if remaining > 1:
                print(f"    {remaining} minutes remaining...")
            time.sleep(60)
    
    # Step 4: 復旧
    print(f"\nStep 4: Machine recovery...")
    if send_test_data(machine_id, gas_url):
        print(f"  ✅ Recovery data sent at: {datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S')}")
        print("  📩 Check Discord for recovery notification")
        return True
    else:
        print("  ❌ Failed to send recovery data")
        return False

def main():
    """メイン実行"""
    print("QUICK TEST - Discord Monitoring System")
    print("=" * 50)
    
    # URL確認
    if GAS_WEBAPP_URL == "YOUR_GAS_WEBAPP_URL_HERE":
        print("❌ Please set the correct GAS_WEBAPP_URL at the top of this script")
        return
    
    print(f"📡 Using GAS URL: {GAS_WEBAPP_URL}")
    print(f"🤖 Test Machine ID: {TEST_MACHINE_ID}")
    
    while True:
        print("\n" + "="*40)
        print("QUICK TEST OPTIONS:")
        print("1. Create test machine sheet")
        print("2. Send single test data")
        print("3. Quick offline test (12 minutes)")
        print("4. Custom offline test")
        print("0. Exit")
        
        choice = input("\nEnter choice (0-4): ").strip()
        
        if choice == "0":
            print("👋 Goodbye!")
            break
        elif choice == "1":
            create_test_machine(TEST_MACHINE_ID, GAS_WEBAPP_URL)
        elif choice == "2":
            send_test_data(TEST_MACHINE_ID, GAS_WEBAPP_URL)
        elif choice == "3":
            quick_offline_test(TEST_MACHINE_ID, GAS_WEBAPP_URL, 12)
        elif choice == "4":
            try:
                offline_min = int(input("Offline duration in minutes (default: 12): ").strip() or "12")
            except ValueError:
                offline_min = 12
            quick_offline_test(TEST_MACHINE_ID, GAS_WEBAPP_URL, offline_min)
        else:
            print("❌ Invalid choice")
    
    print("\n📋 POST-TEST CHECKLIST:")
    print("1. Check if machine sheet was created in Google Sheets")
    print("2. Verify column K1 is set to 'Active' for monitoring")
    print("3. Check Discord for alert/recovery notifications")
    print("4. Run getMonitoringSystemStatus() in GAS for system status")

if __name__ == "__main__":
    main()