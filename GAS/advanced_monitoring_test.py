#!/usr/bin/env python3
"""
Advanced Discord Monitoring System Test Script
Discord監視システムの詳細テスト（複数シナリオ対応）
"""

import requests
import json
import time
import datetime
import threading
import random
from typing import Dict, Any, List
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor

# GAS WebApp URL (実際のURLに変更してください)
GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzDduh5Bb4BEKfMfTfL0JZFrp6GnOptSUTTGorXkC1F-OnebhFMeRn6LNK6qjUH4giohQ/exec"

@dataclass
class MachineConfig:
    """機体設定情報"""
    machine_id: str
    operational_status: str  # Active, Inactive, Maintenance
    send_interval: int  # seconds
    failure_probability: float  # 0.0 - 1.0
    location_drift: float  # GPS座標の変動範囲

class AdvancedTelemetryTester:
    def __init__(self, gas_url: str):
        self.gas_url = gas_url
        self.session = requests.Session()
        self.active_threads = []
        self.stop_event = threading.Event()
        
    def create_telemetry_data(self, machine_id: str, timestamp: str = None, 
                            base_lat: float = 34.124125, base_lng: float = 153.131241,
                            location_drift: float = 0.01) -> Dict[str, Any]:
        """テレメトリデータを作成（完全にexample_json準拠）"""
        if not timestamp:
            timestamp = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")
            
        # GPS座標の変動
        lat = base_lat + random.uniform(-location_drift, location_drift)
        lng = base_lng + random.uniform(-location_drift, location_drift)
        
        # バッテリーレベルの時間による変動シミュレーション
        hour = datetime.datetime.now().hour
        battery_base = 4.2 - (hour * 0.05)  # 時間とともに減少
        battery = max(3.0, battery_base + random.uniform(-0.2, 0.1))
        
        return {
            "DataType": "HK",
            "MachineID": machine_id,
            "MachineTime": timestamp,
            "GPS": {
                "LAT": round(lat, 6),
                "LNG": round(lng, 6),
                "ALT": round(342.5 + random.uniform(-100, 100), 1),
                "SAT": random.randint(4, 12)
            },
            "BAT": round(battery, 2),
            "CMT": self._generate_status_comment(battery)
        }
    
    def _generate_status_comment(self, battery: float) -> str:
        """バッテリー状態に応じたコメント生成"""
        if battery > 3.8:
            return "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE"
        elif battery > 3.5:
            return "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:LOW_BAT_WARNING"
        elif battery > 3.2:
            return "MODE:POWER_SAVE,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:LOW_BATTERY"
        else:
            return "MODE:EMERGENCY,COMM:WEAK,GPS:UNSTABLE,SENSOR:TEMP_WARN,PRESSURE:UNSTABLE,ERROR:CRITICAL_BATTERY"
    
    def send_telemetry(self, data: Dict[str, Any], verbose: bool = True) -> bool:
        """テレメトリデータ送信"""
        try:
            response = self.session.post(
                self.gas_url,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('status') == 'success':
                    if verbose:
                        print(f"✓ {data['MachineID']}: Data sent at {data['MachineTime']}")
                    return True
                else:
                    if verbose:
                        print(f"✗ {data['MachineID']}: Error - {result.get('message')}")
                    return False
            else:
                if verbose:
                    print(f"✗ {data['MachineID']}: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            if verbose:
                print(f"✗ {data['MachineID']}: Exception - {str(e)}")
            return False
    
    def continuous_sender(self, machine_config: MachineConfig):
        """継続的データ送信スレッド"""
        print(f"Started continuous sending for {machine_config.machine_id}")
        
        failure_count = 0
        send_count = 0
        
        while not self.stop_event.is_set():
            try:
                # 通信失敗をシミュレート
                if random.random() < machine_config.failure_probability:
                    failure_count += 1
                    print(f"⚠ {machine_config.machine_id}: Simulated communication failure ({failure_count})")
                    time.sleep(machine_config.send_interval)
                    continue
                
                # データ送信
                data = self.create_telemetry_data(
                    machine_config.machine_id,
                    location_drift=machine_config.location_drift
                )
                
                success = self.send_telemetry(data, verbose=False)
                send_count += 1
                
                if send_count % 10 == 0:  # 10回おきに状況報告
                    print(f"📡 {machine_config.machine_id}: {send_count} messages sent, {failure_count} failures")
                
                time.sleep(machine_config.send_interval)
                
            except Exception as e:
                print(f"✗ {machine_config.machine_id}: Thread error - {str(e)}")
                break
        
        print(f"Stopped sending for {machine_config.machine_id}")
    
    def test_alert_scenarios(self):
        """Discord アラートシナリオテスト"""
        print("\n=== Discord Alert Scenarios Test ===")
        
        scenarios = [
            {
                "name": "Normal Operation → Offline → Recovery",
                "machine_id": "TEST001",
                "steps": [
                    ("Send normal data", 0),
                    ("Go offline", 12*60),  # 12分オフライン
                    ("Resume operation", 0)
                ]
            },
            {
                "name": "Multiple Machines Offline",
                "machine_id": "TEST002,TEST003",
                "steps": [
                    ("Send initial data for multiple machines", 0),
                    ("All machines offline", 15*60),  # 15分オフライン
                    ("Gradual recovery", 0)
                ]
            }
        ]
        
        for i, scenario in enumerate(scenarios, 1):
            print(f"\n--- Scenario {i}: {scenario['name']} ---")
            
            if "," in scenario["machine_id"]:
                machine_ids = scenario["machine_id"].split(",")
            else:
                machine_ids = [scenario["machine_id"]]
            
            for step_name, wait_time in scenario["steps"]:
                print(f"Step: {step_name}")
                
                if "Send" in step_name:
                    for machine_id in machine_ids:
                        data = self.create_telemetry_data(machine_id)
                        self.send_telemetry(data)
                        
                elif "offline" in step_name.lower():
                    print(f"⏳ Waiting {wait_time//60} minutes for Discord alert...")
                    if wait_time > 0:
                        self._wait_with_progress(wait_time)
                        
                elif "recovery" in step_name.lower():
                    print("📡 Resuming data transmission...")
                    for machine_id in machine_ids:
                        data = self.create_telemetry_data(machine_id)
                        self.send_telemetry(data)
                
                time.sleep(2)  # ステップ間の短い待機
    
    def test_multiple_machine_simulation(self, duration_minutes: int = 30):
        """複数機体の同時運用シミュレーション"""
        print(f"\n=== Multiple Machine Simulation ({duration_minutes} minutes) ===")
        
        # テスト機体設定
        machine_configs = [
            MachineConfig("SIM001", "Active", 30, 0.02, 0.005),   # 正常機体
            MachineConfig("SIM002", "Active", 45, 0.05, 0.01),    # やや不安定
            MachineConfig("SIM003", "Active", 60, 0.1, 0.02),     # 不安定
            MachineConfig("SIM004", "Maintenance", 120, 0.0, 0.001), # メンテナンス中
            MachineConfig("SIM005", "Active", 25, 0.15, 0.03)     # 高故障率
        ]
        
        print(f"Starting simulation with {len(machine_configs)} machines:")
        for config in machine_configs:
            print(f"  {config.machine_id}: {config.operational_status}, "
                  f"interval={config.send_interval}s, failure_rate={config.failure_probability:.1%}")
        
        # 機体シート作成
        self._create_test_machines([config.machine_id for config in machine_configs])
        
        # 継続送信開始
        self.stop_event.clear()
        threads = []
        
        for config in machine_configs:
            if config.operational_status == "Active":  # アクティブ機体のみ送信
                thread = threading.Thread(target=self.continuous_sender, args=(config,))
                thread.start()
                threads.append(thread)
                self.active_threads.append(thread)
        
        # 指定時間実行
        try:
            print(f"\n🚀 Simulation running for {duration_minutes} minutes...")
            print("Press Ctrl+C to stop early")
            
            self._wait_with_progress(duration_minutes * 60)
            
        except KeyboardInterrupt:
            print("\n🛑 Simulation stopped by user")
        
        # 停止
        self.stop_event.set()
        for thread in threads:
            thread.join(timeout=5)
        
        print("✓ Simulation completed")
    
    def _wait_with_progress(self, total_seconds: int):
        """進捗表示付き待機"""
        for remaining in range(total_seconds, 0, -30):
            if self.stop_event.is_set():
                break
            minutes = remaining // 60
            seconds = remaining % 60
            print(f"⏳ {minutes:02d}:{seconds:02d} remaining...")
            time.sleep(min(30, remaining))
    
    def _create_test_machines(self, machine_ids: List[str]):
        """テスト機体シート作成"""
        print("Creating test machine sheets...")
        for machine_id in machine_ids:
            register_data = {
                "action": "registerMachine",
                "MachineID": machine_id
            }
            
            try:
                response = self.session.post(
                    self.gas_url,
                    json=register_data,
                    timeout=15
                )
                if response.status_code == 200:
                    result = response.json()
                    if result.get('status') == 'success':
                        print(f"  ✓ {machine_id} sheet created")
                    else:
                        print(f"  ℹ {machine_id}: {result.get('message', 'Already exists')}")
            except Exception as e:
                print(f"  ✗ {machine_id}: {str(e)}")
    
    def cleanup_test_data(self):
        """テストデータクリーンアップ用ヘルパー"""
        print("\n=== Test Data Cleanup ===")
        print("Manual cleanup required:")
        print("1. Delete test machine sheets (SIM001, SIM002, etc.)")
        print("2. Clear alert history: clearAlertHistory()")
        print("3. Reset monitoring settings if needed")

def main():
    """メイン実行関数"""
    print("Advanced Discord Monitoring System Test")
    print("======================================")
    
    if GAS_WEBAPP_URL == "YOUR_GAS_WEBAPP_URL_HERE":
        print("⚠ Please set the correct GAS_WEBAPP_URL in this script first")
        return
    
    tester = AdvancedTelemetryTester(GAS_WEBAPP_URL)
    
    while True:
        print("\n" + "="*60)
        print("Advanced Test Options:")
        print("1. Discord Alert Scenarios Test")
        print("2. Multiple Machine Simulation (30 min)")
        print("3. Custom Duration Simulation")
        print("4. Stress Test (many machines, high frequency)")
        print("5. Battery Degradation Simulation")
        print("9. Cleanup test data (manual steps)")
        print("0. Exit")
        
        choice = input("\nEnter choice (0-9): ").strip()
        
        if choice == "0":
            print("Stopping all threads and exiting...")
            tester.stop_event.set()
            break
        elif choice == "1":
            tester.test_alert_scenarios()
        elif choice == "2":
            tester.test_multiple_machine_simulation(30)
        elif choice == "3":
            try:
                duration = int(input("Duration in minutes (default: 15): ").strip() or "15")
            except ValueError:
                duration = 15
            tester.test_multiple_machine_simulation(duration)
        elif choice == "4":
            print("Stress Test: 10 machines, 15-second intervals")
            print("⚠ This will generate significant load on the system")
            confirm = input("Continue? (y/N): ").strip().lower()
            if confirm == 'y':
                # 高頻度送信設定
                machine_configs = [
                    MachineConfig(f"STRESS{i:02d}", "Active", 15, 0.02, 0.01) 
                    for i in range(1, 11)
                ]
                # ストレステスト実行（実装は省略、基本と同じ構造）
                print("Stress test implementation would go here...")
        elif choice == "5":
            print("Battery Degradation Simulation")
            print("This simulates gradual battery degradation over time")
            # バッテリー劣化シミュレーション実装（省略）
            print("Battery degradation simulation implementation would go here...")
        elif choice == "9":
            tester.cleanup_test_data()
        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()