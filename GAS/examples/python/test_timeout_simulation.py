#!/usr/bin/env python3
"""
Machine Timeout Simulation Script
Simulates various timeout scenarios for Discord notification testing
"""

import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List
import sys
import argparse

class TimeoutSimulator:
    def __init__(self, gas_endpoint: str, machine_id: str = None):
        """
        Initialize timeout simulator
        
        Args:
            gas_endpoint: GAS WebApp URL
            machine_id: Machine ID to use (auto-generated if None)
        """
        self.gas_endpoint = gas_endpoint.rstrip('/')
        self.machine_id = machine_id or f"SIM_{int(time.time())}"
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def send_telemetry(self, minutes_ago: int = 0, comment: str = "") -> bool:
        """Send telemetry data with specific timestamp"""
        timestamp = datetime.now() - timedelta(minutes=minutes_ago)
        machine_time = timestamp.strftime("%Y/%m/%d %H:%M:%S")
        
        data = {
            "DataType": "SIM",
            "MachineID": self.machine_id,
            "MachineTime": machine_time,
            "GPS": {
                "LAT": 35.6762 + (hash(self.machine_id) % 100) * 0.0001,
                "LNG": 139.6503 + (hash(self.machine_id) % 100) * 0.0001,
                "ALT": 50 + (minutes_ago % 50),
                "SAT": max(4, 12 - minutes_ago)
            },
            "BAT": max(2.5, 4.2 - (minutes_ago * 0.05)),
            "CMT": comment or f"Simulation data - {minutes_ago}min ago"
        }
        
        try:
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    self.log(f"📡 Sent telemetry: {machine_time} ({minutes_ago}min ago)")
                    return True
            
            self.log(f"❌ Failed to send telemetry: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"❌ Error sending telemetry: {e}")
            return False
    
    def set_active_status(self, is_active: bool) -> bool:
        """Set machine active status"""
        data = {
            "action": "setActiveStatus", 
            "machineId": self.machine_id,
            "isActive": is_active
        }
        
        try:
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    status = "ACTIVE" if is_active else "INACTIVE"
                    self.log(f"⚙️ Machine set to {status}")
                    return True
            
            self.log(f"❌ Failed to set active status")
            return False
            
        except Exception as e:
            self.log(f"❌ Error setting active status: {e}")
            return False
    
    def trigger_manual_check(self) -> bool:
        """Trigger manual machine check"""
        data = {
            "action": "checkMachine",
            "machineId": self.machine_id
        }
        
        try:
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    machine_status = result.get("machine_status", {})
                    status = machine_status.get("status", "unknown")
                    self.log(f"🔍 Manual check completed - Status: {status}")
                    return True
            
            self.log(f"❌ Manual check failed")
            return False
            
        except Exception as e:
            self.log(f"❌ Error in manual check: {e}")
            return False
    
    def register_machine(self) -> bool:
        """Register test machine"""
        data = {
            "action": "registerMachine",
            "MachineID": self.machine_id,
            "metadata": {
                "type": "timeout_simulation",
                "created": datetime.now().isoformat()
            }
        }
        
        try:
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    self.log(f"✅ Machine {self.machine_id} registered")
                    return True
                elif "already exists" in result.get("message", ""):
                    self.log(f"ℹ️ Machine {self.machine_id} already exists")
                    return True
            
            self.log(f"❌ Failed to register machine")
            return False
            
        except Exception as e:
            self.log(f"❌ Error registering machine: {e}")
            return False

    def scenario_basic_timeout(self):
        """Basic timeout scenario - 15 minutes old data"""
        self.log("🎭 SCENARIO: Basic Timeout (15 minutes)")
        self.log("This should trigger an initial signal lost notification")
        
        # Send old data
        self.send_telemetry(15, "Old data to trigger timeout")
        self.set_active_status(True)
        time.sleep(2)
        self.trigger_manual_check()
        
        self.log("✅ Check Discord for initial signal lost notification")
    
    def scenario_reminder_notifications(self):
        """Simulate reminder notifications (every 10 minutes)"""
        self.log("🎭 SCENARIO: Reminder Notifications")
        self.log("This simulates multiple reminder notifications")
        
        # Send very old data
        self.send_telemetry(25, "Very old data")
        self.set_active_status(True)
        time.sleep(2)
        
        # First check (initial notification)
        self.log("Triggering initial timeout...")
        self.trigger_manual_check()
        time.sleep(3)
        
        # Second check (first reminder)
        self.log("Triggering first reminder...")
        self.trigger_manual_check()
        time.sleep(3)
        
        # Third check (second reminder)
        self.log("Triggering second reminder...")
        self.trigger_manual_check()
        
        self.log("✅ Check Discord for multiple notifications")
    
    def scenario_recovery(self):
        """Simulate signal recovery"""
        self.log("🎭 SCENARIO: Signal Recovery")
        self.log("This should trigger a recovery notification")
        
        # Send fresh data
        self.send_telemetry(0, "Fresh data - signal recovered!")
        time.sleep(2)
        self.trigger_manual_check()
        
        self.log("✅ Check Discord for recovery notification")
    
    def scenario_battery_degradation(self):
        """Simulate gradual battery degradation before timeout"""
        self.log("🎭 SCENARIO: Battery Degradation Timeline")
        
        battery_timeline = [
            (0, 4.2, "Full battery"),
            (5, 3.8, "Good battery"),
            (10, 3.4, "Medium battery"),
            (15, 3.0, "Low battery - then signal lost"),
            (20, 2.8, "Critical battery - last signal")
        ]
        
        for minutes_ago, battery, description in battery_timeline:
            timestamp = datetime.now() - timedelta(minutes=minutes_ago)
            machine_time = timestamp.strftime("%Y/%m/%d %H:%M:%S")
            
            data = {
                "DataType": "SIM",
                "MachineID": self.machine_id,
                "MachineTime": machine_time,
                "GPS": {
                    "LAT": 35.6762,
                    "LNG": 139.6503,
                    "ALT": 50,
                    "SAT": 8
                },
                "BAT": battery,
                "CMT": description
            }
            
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(data)
            )
            
            self.log(f"📊 {machine_time}: {battery}V - {description}")
            time.sleep(1)
        
        self.set_active_status(True)
        time.sleep(2)
        self.trigger_manual_check()
        
        self.log("✅ Battery degradation timeline created, check notifications")
    
    def scenario_intermittent_connection(self):
        """Simulate intermittent connection issues"""
        self.log("🎭 SCENARIO: Intermittent Connection")
        
        # Timeline: sporadic data with gaps
        timeline = [
            (25, "Last known good position"),
            (20, "Signal getting weak"),
            (18, "Brief reconnection"),
            (15, "Signal lost again - timeout threshold")
        ]
        
        for minutes_ago, comment in timeline:
            self.send_telemetry(minutes_ago, comment)
            time.sleep(1)
        
        self.set_active_status(True)
        time.sleep(2)
        self.trigger_manual_check()
        
        self.log("✅ Intermittent connection scenario completed")
    
    def interactive_mode(self):
        """Interactive mode for manual testing"""
        self.log("🎮 INTERACTIVE MODE")
        self.log(f"Machine ID: {self.machine_id}")
        
        while True:
            print("\nAvailable commands:")
            print("1. Send fresh telemetry (now)")
            print("2. Send old telemetry (15 min ago)")
            print("3. Set machine ACTIVE")
            print("4. Set machine INACTIVE")
            print("5. Trigger manual check")
            print("6. Send very old telemetry (30 min ago)")
            print("q. Quit")
            
            choice = input("\nEnter choice: ").strip().lower()
            
            if choice == 'q':
                break
            elif choice == '1':
                self.send_telemetry(0, "Fresh data from interactive mode")
            elif choice == '2':
                self.send_telemetry(15, "Old data from interactive mode")
            elif choice == '3':
                self.set_active_status(True)
            elif choice == '4':
                self.set_active_status(False)
            elif choice == '5':
                self.trigger_manual_check()
            elif choice == '6':
                self.send_telemetry(30, "Very old data from interactive mode")
            else:
                print("Invalid choice")

def main():
    parser = argparse.ArgumentParser(description="Machine Timeout Simulation")
    parser.add_argument("endpoint", nargs='?', default="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", 
                       help="GAS WebApp URL (optional if set in script)")
    parser.add_argument("--machine-id", help="Machine ID to use")
    parser.add_argument("--scenario", choices=[
        "basic", "reminder", "recovery", "battery", "intermittent", "interactive"
    ], default="basic", help="Scenario to run")
    
    args = parser.parse_args()
    
    # Check if URL needs to be updated
    if "YOUR_SCRIPT_ID" in args.endpoint:
        print("❌ Please update the default endpoint URL in the script")
        print("   Look for: default=\"https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec\"")
        print("   Replace YOUR_SCRIPT_ID with your actual script ID")
        print()
        print("Alternative: Run with URL as argument:")
        print("   python3 test_timeout_simulation.py https://script.google.com/.../exec")
        sys.exit(1)
    
    simulator = TimeoutSimulator(args.endpoint, args.machine_id)
    
    print("Machine Timeout Simulation")
    print("=" * 30)
    print(f"Endpoint: {args.endpoint}")
    print(f"Machine ID: {simulator.machine_id}")
    print(f"Scenario: {args.scenario}")
    print()
    
    # Register machine first
    if not simulator.register_machine():
        print("❌ Failed to register machine")
        sys.exit(1)
    
    try:
        if args.scenario == "basic":
            simulator.scenario_basic_timeout()
        elif args.scenario == "reminder":
            simulator.scenario_reminder_notifications()
        elif args.scenario == "recovery":
            simulator.scenario_recovery()
        elif args.scenario == "battery":
            simulator.scenario_battery_degradation()
        elif args.scenario == "intermittent":
            simulator.scenario_intermittent_connection()
        elif args.scenario == "interactive":
            simulator.interactive_mode()
        
        print(f"\n🎯 Scenario '{args.scenario}' completed!")
        print("Check your Discord channel for notifications.")
        
    except KeyboardInterrupt:
        print("\n⚠️ Simulation interrupted")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()