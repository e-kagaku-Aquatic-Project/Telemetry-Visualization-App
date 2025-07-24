#!/usr/bin/env python3
"""
Quick Setup Script for Notification System Testing
Helps configure the GAS endpoint URL in all test scripts
"""

import os
import re
import sys

def update_script_url(file_path: str, new_url: str) -> bool:
    """Update the GAS endpoint URL in a Python script"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match the placeholder URL
        pattern = r'https://script\.google\.com/macros/s/YOUR_SCRIPT_ID/exec'
        
        if pattern in content:
            # Replace the placeholder with the actual URL
            updated_content = re.sub(pattern, new_url, content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            print(f"✅ Updated {os.path.basename(file_path)}")
            return True
        else:
            print(f"ℹ️ No placeholder found in {os.path.basename(file_path)}")
            return True
            
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Quick Setup Script for Notification System Testing")
        print("=" * 50)
        print()
        print("Usage: python3 test_quick_setup.py <GAS_WEBAPP_URL>")
        print()
        print("Example:")
        print("  python3 test_quick_setup.py https://script.google.com/macros/s/AKfycbx.../exec")
        print()
        print("This script will update all test scripts with your GAS WebApp URL")
        print("so you can run them without arguments:")
        print("  python3 test_notification_system.py")
        print("  python3 test_timeout_simulation.py")
        print("  python3 test_api_compatibility.py")
        print("  python3 test_realistic_scenario.py")
        sys.exit(1)
    
    gas_url = sys.argv[1].strip()
    
    # Validate URL format
    if not gas_url.startswith('https://script.google.com/macros/s/'):
        print("❌ Invalid GAS WebApp URL format")
        print("   Expected: https://script.google.com/macros/s/.../exec")
        print(f"   Got: {gas_url}")
        sys.exit(1)
    
    if not gas_url.endswith('/exec'):
        print("❌ URL should end with '/exec'")
        print(f"   Got: {gas_url}")
        sys.exit(1)
    
    print("Quick Setup for Notification System Testing")
    print("=" * 45)
    print(f"Target URL: {gas_url}")
    print()
    
    # List of test scripts to update
    script_files = [
        'test_notification_system.py',
        'test_timeout_simulation.py', 
        'test_api_compatibility.py',
        'test_realistic_scenario.py'
    ]
    
    updated_count = 0
    
    for script_file in script_files:
        if os.path.exists(script_file):
            if update_script_url(script_file, gas_url):
                updated_count += 1
        else:
            print(f"⚠️ {script_file} not found")
    
    print()
    if updated_count > 0:
        print(f"🎉 Setup complete! Updated {updated_count} test scripts.")
        print()
        print("You can now run tests without URL arguments:")
        print("  python3 test_notification_system.py")
        print("  python3 test_timeout_simulation.py --scenario basic")
        print("  python3 test_api_compatibility.py")
        print("  python3 test_realistic_scenario.py")
        print()
        print("Or still use URL arguments if needed:")
        print("  python3 test_notification_system.py <DIFFERENT_URL>")
    else:
        print("❌ No scripts were updated. Please check the file paths.")

if __name__ == "__main__":
    main()