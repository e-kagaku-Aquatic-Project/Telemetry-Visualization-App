#!/usr/bin/env python3
"""
Realistic Telemetry Scenario Script
Simulates real-world machine operation using the exact telemetry format
Based on: GAS/example_json/telemetry_data.json
"""

import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List
import sys
import random
import math

class RealisticTelemetrySimulator:
    def __init__(self, gas_endpoint: str = "https://script.google.com/macros/s/AKfycbxWyEBGpdm09R5UdVqiYUrUiZ1FbeB4PU9KKKJJjLhI__Ged3_5oSfmRjLaBx2KHy4QUQ/exec"):
        """Initialize realistic telemetry simulator"""
        self.gas_endpoint = gas_endpoint.rstrip('/')
        self.session = requests.Session()
        
        # Base telemetry data from example_json/telemetry_data.json
        self.base_telemetry = {
            "DataType": "HK",
            "MachineID": "00453",
            "MachineTime": "2025/07/16 00:41:41",
            "GPS": {
                "LAT": 34.124125,
                "LNG": 153.131241,
                "ALT": 342.5,
                "SAT": 43
            },
            "BAT": 3.45,
            "CMT": "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE"
        }
        
        # Mission parameters
        self.current_lat = self.base_telemetry["GPS"]["LAT"]
        self.current_lng = self.base_telemetry["GPS"]["LNG"]
        self.current_alt = self.base_telemetry["GPS"]["ALT"]
        self.current_battery = self.base_telemetry["BAT"]
        self.mission_start_time = datetime.now()
        
    def log(self, message: str, level: str = "INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        symbols = {
            "INFO": "ℹ️",
            "SUCCESS": "✅", 
            "ERROR": "❌",
            "WARNING": "⚠️",
            "MISSION": "🚀",
            "SIGNAL": "📡",
            "BATTERY": "🔋",
            "GPS": "🛰️"
        }
        symbol = symbols.get(level, "ℹ️")
        print(f"[{timestamp}] {symbol} {message}")
    
    def generate_realistic_telemetry(self, minutes_offset: int = 0) -> dict:
        """Generate realistic telemetry data with mission progression"""
        
        # Calculate mission time
        mission_time = self.mission_start_time + timedelta(minutes=minutes_offset)
        machine_time = mission_time.strftime("%Y/%m/%d %H:%M:%S")
        
        # Mission progression (simulating movement)
        mission_minutes = minutes_offset if minutes_offset >= 0 else 0
        
        # Simulate movement (circular pattern around base position)
        angle = (mission_minutes * 2 * math.pi) / 60  # One circle per hour
        radius = 0.001  # ~100m radius
        
        lat = self.base_telemetry["GPS"]["LAT"] + radius * math.cos(angle)
        lng = self.base_telemetry["GPS"]["LNG"] + radius * math.sin(angle)
        alt = self.base_telemetry["GPS"]["ALT"] + random.uniform(-5, 15)  # Altitude variation
        
        # Battery degradation (realistic discharge curve)
        battery_drain_rate = 0.02  # 0.02V per hour
        battery = max(2.5, self.base_telemetry["BAT"] - (mission_minutes * battery_drain_rate / 60))
        
        # GPS satellite count (realistic variation)
        sat_count = max(4, min(12, self.base_telemetry["GPS"]["SAT"] + random.randint(-3, 2)))
        
        # Generate realistic comment based on status
        comment = self.generate_realistic_comment(battery, sat_count, mission_minutes)
        
        telemetry = {
            "DataType": "HK",
            "MachineID": self.base_telemetry["MachineID"],
            "MachineTime": machine_time,
            "GPS": {
                "LAT": round(lat, 6),
                "LNG": round(lng, 6),
                "ALT": round(alt, 1),
                "SAT": sat_count
            },
            "BAT": round(battery, 2),
            "CMT": comment
        }
        
        return telemetry
    
    def generate_realistic_comment(self, battery: float, satellites: int, mission_minutes: int) -> str:
        """Generate realistic status comment"""
        comments = []
        
        # Mission mode
        if mission_minutes < 30:
            comments.append("MODE:NORMAL")
        elif mission_minutes < 60:
            comments.append("MODE:SURVEY")
        else:
            comments.append("MODE:RETURN")
        
        # Communication status
        if satellites >= 8:
            comments.append("COMM:EXCELLENT")
        elif satellites >= 6:
            comments.append("COMM:GOOD")
        elif satellites >= 4:
            comments.append("COMM:POOR")
        else:
            comments.append("COMM:CRITICAL")
        
        # GPS status
        if satellites >= 6:
            comments.append("GPS:LOCKED")
        elif satellites >= 4:
            comments.append("GPS:WEAK")
        else:
            comments.append("GPS:SEARCHING")
        
        # Sensor status (random variation)
        sensor_status = random.choice(["TEMP_OK", "TEMP_HIGH", "TEMP_LOW"])
        comments.append(f"SENSOR:{sensor_status}")
        
        pressure_status = random.choice(["PRESSURE:STABLE", "PRESSURE:RISING", "PRESSURE:FALLING"])
        comments.append(pressure_status)
        
        # Error status based on conditions
        if battery < 3.0:
            comments.append("ERROR:LOW_BAT")
        elif satellites < 4:
            comments.append("ERROR:GPS_WEAK")
        else:
            comments.append("ERROR:NONE")
        
        return ",".join(comments)
    
    def send_telemetry(self, telemetry_data: dict) -> bool:
        """Send telemetry data to GAS endpoint"""
        try:
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(telemetry_data)
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    return True
            
            self.log(f"Failed to send telemetry: {response.status_code}", "ERROR")
            return False
            
        except Exception as e:
            self.log(f"Error sending telemetry: {e}", "ERROR")
            return False
    
    def set_machine_active(self, is_active: bool) -> bool:
        """Set machine active status"""
        try:
            data = {
                "action": "setActiveStatus",
                "machineId": self.base_telemetry["MachineID"],
                "isActive": is_active
            }
            
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("status") == "success"
            
            return False
            
        except:
            return False
    
    def register_machine(self) -> bool:
        """Register the machine"""
        try:
            data = {
                "action": "registerMachine",
                "MachineID": self.base_telemetry["MachineID"],
                "metadata": {
                    "type": "realistic_simulation",
                    "start_time": datetime.now().isoformat(),
                    "mission": "Survey and monitoring operation"
                }
            }
            
            response = self.session.post(
                self.gas_endpoint,
                headers={"Content-Type": "application/json"},
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success" or "already exists" in result.get("message", ""):
                    return True
            
            return False
            
        except:
            return False
    
    def scenario_full_mission(self):
        """Complete mission scenario: Normal operation → Signal loss → Recovery"""
        machine_id = self.base_telemetry["MachineID"]
        
        self.log("🚀 REALISTIC MISSION SCENARIO", "MISSION")
        self.log(f"Machine ID: {machine_id}", "MISSION")
        self.log("Phase 1: Normal Mission Operation", "MISSION")
        
        # Register machine
        if not self.register_machine():
            self.log("Failed to register machine", "ERROR")
            return False
        
        # Set machine active
        if not self.set_machine_active(True):
            self.log("Failed to set machine active", "ERROR")
            return False
        
        # Phase 1: Normal operation (30 minutes of data)
        self.log("📡 Sending normal telemetry data (30 minutes)...", "SIGNAL")
        
        normal_operation_timeline = [
            (0, "Mission start - All systems nominal"),
            (5, "Initial position established"),
            (10, "Beginning survey pattern"),
            (15, "Quarter mission complete"),
            (20, "Survey data collection ongoing"),
            (25, "Approaching signal loss area"),
            (30, "Last known good position")
        ]
        
        for minutes, description in normal_operation_timeline:
            telemetry = self.generate_realistic_telemetry(-minutes)
            
            # Add custom comment for key events
            if description != telemetry["CMT"]:
                telemetry["CMT"] = f"{telemetry['CMT']},NOTE:{description.replace(' ', '_')}"
            
            if self.send_telemetry(telemetry):
                battery = telemetry["BAT"]
                satellites = telemetry["GPS"]["SAT"]
                self.log(f"T-{minutes:2d}min: {description} (🔋{battery}V, 🛰️{satellites}sat)", "SIGNAL")
            
            time.sleep(1)  # Brief pause between transmissions
        
        self.log("⚠️ Signal loss begins now...", "WARNING")
        self.log("Phase 2: Signal Loss Period (15 minutes)", "MISSION")
        
        # Phase 2: Signal loss period - no data transmission
        # This simulates the machine going into a dead zone
        self.log("📵 No telemetry transmission (simulating dead zone)", "WARNING")
        self.log("🕐 Signal loss duration: 15 minutes", "WARNING")
        self.log("   (In real scenario, monitoring system will detect timeout after 10 minutes)", "WARNING")
        
        # Wait for timeout detection (in real scenario, this would be automatic)
        self.log("💭 Simulating 15-minute communication blackout...", "WARNING")
        self.log("   Check Discord for timeout notifications during this period", "WARNING")
        
        # Show a countdown for dramatic effect
        for remaining in [15, 10, 5, 3, 2, 1]:
            self.log(f"⏰ Signal recovery in {remaining} minutes...", "WARNING")
            time.sleep(2)  # Shortened for demo
        
        # Phase 3: Signal recovery
        self.log("Phase 3: Signal Recovery", "MISSION")
        self.log("📡 Communication restored!", "SUCCESS")
        
        # Send recovery telemetry data
        recovery_timeline = [
            (0, "Signal restored - Position confirmed"),
            (2, "All systems operational"),
            (5, "Resuming mission operations"),
            (10, "Mission completion in progress"),
            (15, "Returning to base")
        ]
        
        for minutes, description in recovery_timeline:
            telemetry = self.generate_realistic_telemetry(minutes)
            
            # Adjust for signal recovery conditions
            if minutes == 0:
                # First signal after recovery might be weak
                telemetry["GPS"]["SAT"] = max(4, telemetry["GPS"]["SAT"] - 2)
                telemetry["CMT"] = f"{telemetry['CMT']},RECOVERY:SIGNAL_RESTORED"
            
            telemetry["CMT"] = f"{telemetry['CMT']},NOTE:{description.replace(' ', '_')}"
            
            if self.send_telemetry(telemetry):
                battery = telemetry["BAT"]
                satellites = telemetry["GPS"]["SAT"]
                self.log(f"T+{minutes:2d}min: {description} (🔋{battery}V, 🛰️{satellites}sat)", "SUCCESS")
            
            time.sleep(1)
        
        self.log("✅ Mission scenario completed!", "SUCCESS")
        self.log("📊 Check Discord for the complete notification sequence:", "SUCCESS")
        self.log("   1. Initial signal lost notification (after 10min timeout)", "SUCCESS") 
        self.log("   2. Reminder notifications (every 10min during blackout)", "SUCCESS")
        self.log("   3. Signal recovery notification", "SUCCESS")
        
        return True
    
    def scenario_gradual_degradation(self):
        """Scenario with gradual signal degradation before loss"""
        machine_id = self.base_telemetry["MachineID"]
        
        self.log("📉 GRADUAL DEGRADATION SCENARIO", "MISSION")
        self.log(f"Machine ID: {machine_id}", "MISSION")
        
        # Register and activate machine
        self.register_machine()
        self.set_machine_active(True)
        
        # Timeline with degrading conditions
        degradation_timeline = [
            (0, 8, 4.2, "Optimal conditions"),
            (5, 7, 4.0, "Slight interference detected"),
            (10, 6, 3.8, "Signal quality decreasing"),
            (15, 4, 3.6, "Poor signal conditions"),
            (20, 3, 3.4, "Critical signal degradation"),
            (25, 2, 3.2, "Minimal satellite lock"),
            (30, 1, 3.0, "Signal extremely weak - last transmission")
        ]
        
        for minutes, satellites, battery, description in degradation_timeline:
            telemetry = self.generate_realistic_telemetry(-minutes)
            
            # Override with degradation values
            telemetry["GPS"]["SAT"] = satellites
            telemetry["BAT"] = battery
            telemetry["CMT"] = self.generate_realistic_comment(battery, satellites, minutes)
            telemetry["CMT"] += f",NOTE:{description.replace(' ', '_')}"
            
            if self.send_telemetry(telemetry):
                self.log(f"T-{minutes:2d}min: {description} (🔋{battery}V, 🛰️{satellites}sat)", "WARNING")
            
            time.sleep(1)
        
        self.log("📵 Signal lost due to degraded conditions", "ERROR")
        self.log("⏰ Waiting for timeout detection and recovery...", "WARNING")
        
        # Simulate recovery after some time
        time.sleep(5)
        
        recovery_telemetry = self.generate_realistic_telemetry(0)
        recovery_telemetry["CMT"] += ",RECOVERY:CONDITIONS_IMPROVED"
        
        if self.send_telemetry(recovery_telemetry):
            self.log("📡 Signal recovered - conditions improved", "SUCCESS")
        
        return True
    
    def scenario_battery_critical(self):
        """Scenario focusing on battery degradation"""
        machine_id = self.base_telemetry["MachineID"]
        
        self.log("🔋 BATTERY CRITICAL SCENARIO", "MISSION")
        self.log(f"Machine ID: {machine_id}", "MISSION")
        
        # Register and activate machine
        self.register_machine()
        self.set_machine_active(True)
        
        # Battery degradation timeline
        battery_timeline = [
            (0, 4.2, "Full charge - mission start"),
            (30, 3.8, "Good battery level"),
            (60, 3.4, "Battery at 70%"),
            (90, 3.0, "Battery at 50% - monitoring required"),
            (120, 2.8, "Low battery warning"),
            (135, 2.6, "Critical battery level"),
            (145, 2.4, "Emergency power mode"),
            (150, 2.2, "System shutdown imminent")
        ]
        
        for minutes, battery, description in battery_timeline:
            telemetry = self.generate_realistic_telemetry(-minutes)
            telemetry["BAT"] = battery
            
            # Adjust other parameters based on battery level
            if battery < 3.0:
                telemetry["GPS"]["SAT"] = max(4, telemetry["GPS"]["SAT"] - 2)  # Power saving mode
            
            telemetry["CMT"] = self.generate_realistic_comment(battery, telemetry["GPS"]["SAT"], minutes)
            telemetry["CMT"] += f",NOTE:{description.replace(' ', '_')}"
            
            if self.send_telemetry(telemetry):
                level = "BATTERY" if battery > 3.0 else "ERROR"
                self.log(f"T-{minutes:3d}min: {description} (🔋{battery}V)", level)
            
            time.sleep(0.5)
        
        self.log("🔋 Battery depleted - system shutdown", "ERROR")
        self.log("⏰ Simulating system down time...", "WARNING")
        
        # Simulate system recovery (e.g., solar charging, battery replacement)
        time.sleep(3)
        
        recovery_telemetry = self.generate_realistic_telemetry(0)
        recovery_telemetry["BAT"] = 4.1  # Fresh battery/solar charge
        recovery_telemetry["CMT"] += ",RECOVERY:POWER_RESTORED"
        
        if self.send_telemetry(recovery_telemetry):
            self.log("⚡ Power restored - system back online", "SUCCESS")
        
        return True

def main():
    # GAS WebApp URL
    gas_endpoint = "https://script.google.com/macros/s/AKfycbxWyEBGpdm09R5UdVqiYUrUiZ1FbeB4PU9KKKJJjLhI__Ged3_5oSfmRjLaBx2KHy4QUQ/exec"
    
    # Allow URL override from command line
    if len(sys.argv) >= 2:
        gas_endpoint = sys.argv[1]
    
    # Check if URL needs to be updated
    if "YOUR_SCRIPT_ID" in gas_endpoint:
        print("❌ Please update the gas_endpoint URL or run with URL argument")
        print("   Update: gas_endpoint = \"https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec\"")
        print("   Or run: python3 test_realistic_scenario.py https://script.google.com/.../exec")
        sys.exit(1)
    
    simulator = RealisticTelemetrySimulator(gas_endpoint)
    
    print("Realistic Telemetry Mission Simulator")
    print("=" * 40)
    print(f"Endpoint: {gas_endpoint}")
    print(f"Machine ID: {simulator.base_telemetry['MachineID']}")
    print(f"Based on: example_json/telemetry_data.json")
    print()
    
    # Show available scenarios
    scenarios = {
        "1": ("Full Mission", simulator.scenario_full_mission),
        "2": ("Gradual Degradation", simulator.scenario_gradual_degradation),
        "3": ("Battery Critical", simulator.scenario_battery_critical)
    }
    
    if len(sys.argv) >= 3:
        # Direct scenario selection
        scenario_choice = sys.argv[2]
    else:
        # Interactive selection
        print("Available scenarios:")
        for key, (name, _) in scenarios.items():
            print(f"  {key}. {name}")
        print()
        scenario_choice = input("Select scenario (1-3): ").strip()
    
    if scenario_choice in scenarios:
        scenario_name, scenario_func = scenarios[scenario_choice]
        print(f"Running scenario: {scenario_name}")
        print()
        
        try:
            success = scenario_func()
            if success:
                print(f"\n🎉 '{scenario_name}' scenario completed successfully!")
                print("Check Discord for notification sequence.")
            else:
                print(f"\n❌ '{scenario_name}' scenario failed.")
        except KeyboardInterrupt:
            print("\n⚠️ Scenario interrupted by user")
        except Exception as e:
            print(f"\n❌ Scenario error: {e}")
    else:
        print("❌ Invalid scenario selection")
        sys.exit(1)

if __name__ == "__main__":
    main()