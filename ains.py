import requests
import json

url = 'http://219.94.245.44:80'  # 中継サーバのURL

data = {
    "DataType": "HK",
    "MachineID": "iseki",
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

try:
    response = requests.post(url, json=data, timeout=10)
    print(f'Status Code: {response.status_code}')
    print('Response Body:')
    print(response.text)
except requests.exceptions.RequestException as e:
    print(f'Error occurred: {e}')