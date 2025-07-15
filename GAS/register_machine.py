#!/usr/bin/env python3
"""
Google Apps Script Machine Registration Script

This script sends machine registration requests to the Google Apps Script 
WebApp endpoint to create new sheets for machines.
"""

import json
import requests
from typing import Dict, Any, Optional


class MachineRegistrar:
    def __init__(self, webapp_url: str):
        """
        Initialize machine registration class
        
        Args:
            webapp_url: Google Apps Script WebApp URL
        """
        self.webapp_url = webapp_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'GAS-Machine-Registrar/1.0'
        })
    
    def register_machine(self, machine_id: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Register machine (create sheet)
        
        Args:
            machine_id: Machine ID
            metadata: Optional metadata
            
        Returns:
            Response dictionary
        """
        registration_data = {
            "action": "registerMachine",
            "MachineID": machine_id
        }
        
        if metadata:
            registration_data["metadata"] = metadata
        
        try:
            print(f"\nRegistration data: {json.dumps(registration_data, indent=2, ensure_ascii=False)}")
            
            response = self.session.post(
                self.webapp_url,
                json=registration_data,
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
    
    def register_single_machine(self, machine_id: str):
        """
        Register single machine
        
        Args:
            machine_id: Machine ID
        """
        print(f"\n=== Machine Registration: {machine_id} ===")
        
        result = self.register_machine(machine_id)
        
        if result.get("status") == "success":
            print("✓ Machine registration success")
            print(f"  - Sheet name: {result.get('sheetName')}")
            print(f"  - Machine ID: {result.get('machineId')}")
            print(f"  - Registration time: {result.get('registeredAt')}")
        else:
            print(f"✗ Machine registration failed: {result.get('message')}")
    
    def register_multiple_machines(self, machine_ids: list):
        """
        Register multiple machines in batch
        
        Args:
            machine_ids: List of machine IDs
        """
        print(f"\n=== Multiple Machine Registration (Total: {len(machine_ids)}) ===")
        
        success_count = 0
        failed_count = 0
        
        for machine_id in machine_ids:
            print(f"\n--- Machine {machine_id} ---")
            
            result = self.register_machine(machine_id)
            
            if result.get("status") == "success":
                success_count += 1
                print(f"✓ Machine {machine_id} registration success")
            else:
                failed_count += 1
                print(f"✗ Machine {machine_id} registration failed: {result.get('message')}")
        
        print(f"\n=== Registration Results ===")
        print(f"Success: {success_count}/{len(machine_ids)}")
        print(f"Failed: {failed_count}/{len(machine_ids)}")


def main():
    """
    Main function
    """
    # TODO: Replace with actual GAS WebApp URL
    webapp_url = "https://script.google.com/macros/s/AKfycbys_1sl065_wV_0RusA_aIOxtA3HUuqizsItE7q8g6Qq9vyrd836MtfSKtc5oRh0PRCcA/exec"
    
    print("Google Apps Script Machine Registration Tool")
    print("=" * 50)
    print(f"Target URL: {webapp_url}")
    print()
    
    # Warning if URL is not set
    if "YOUR_SCRIPT_ID" in webapp_url:
        print("⚠️  Warning: WebApp URL is not set")
        print("   Please publish WebApp on script.google.com and set the URL")
        print("   Example: https://script.google.com/macros/s/AKfycbx.../exec")
        return
    
    registrar = MachineRegistrar(webapp_url)
    
    try:
        # Registration menu
        while True:
            print("\nMachine Registration Menu:")
            print("1. Single Machine Registration")
            print("2. Multiple Machine Registration")
            print("3. Exit")
            
            choice = input("\nPlease select (1-3): ").strip()
            
            if choice == "1":
                machine_id = input("Machine ID: ").strip()
                if machine_id:
                    registrar.register_single_machine(machine_id)
                else:
                    print("Please enter machine ID")
            
            elif choice == "2":
                ids_input = input("Machine IDs (comma separated): ").strip()
                if ids_input:
                    machine_ids = [id.strip() for id in ids_input.split(",") if id.strip()]
                    if machine_ids:
                        registrar.register_multiple_machines(machine_ids)
                    else:
                        print("Please enter valid machine IDs")
                else:
                    print("Please enter machine IDs")
            
            elif choice == "3":
                print("Exiting registration tool")
                break
            
            else:
                print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\n\nRegistration was interrupted")
    except Exception as e:
        print(f"\nError occurred: {e}")


if __name__ == "__main__":
    main()