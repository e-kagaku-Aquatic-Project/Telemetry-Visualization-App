"""
Google Apps Script WebApp Test Data Sender (v2.0.0)
Made by Shintaro Matsumoto
"""
import requests
import json
from datetime import datetime

def send_data_to_gas(data, gas_url):
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            gas_url,
            data=json.dumps(data),
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"success: {result}")
            return result
        else:
            print(f"failed: {response.status_code}")
            print(f"response: {response.text}")
            return None
            
    except Exception as e:
        print(f"error: {e}")
        return None

def create_sensor_data(machine_id, latitude, longitude, altitude, gps_satellites, battery, comment):
    return {
        "DataType": "HK",
        "MachineID": machine_id,
        "MachineTime": datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
        "GPS": {
            "LAT": latitude,
            "LNG": longitude,
            "ALT": altitude,
            "SAT": gps_satellites
        },
        "BAT": battery,
        "CMT": comment
    }

if __name__ == "__main__":
    sensor_data = create_sensor_data(
        machine_id="004353",
        latitude=34.124125,
        longitude=153.131241,
        altitude=342.5,
        gps_satellites=43,
        battery=3.45,
        comment="MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE"
    )
    
    # GAS WebApp URL
    gas_url = "https://script.google.com/macros/s/AKfycbys_1sl065_wV_0RusA_aIOxtA3HUuqizsItE7q8g6Qq9vyrd836MtfSKtc5oRh0PRCcA/exec"
    
    # データ送信
    send_data_to_gas(sensor_data, gas_url)
    
    print(f"Send data: {json.dumps(sensor_data, indent=2, ensure_ascii=False)}")