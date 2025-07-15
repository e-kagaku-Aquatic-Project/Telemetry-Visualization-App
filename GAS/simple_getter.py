# GASからJsonデータを取得するためのスクリプト

import requests
import json

def get_data_from_gas(gas_url, action, machine_id=None):
    try:
        params = {'action': action}
        if machine_id:
            params['machineId'] = machine_id
        
        response = requests.get(gas_url, params=params)
        
        if response.status_code == 200:
            result = response.json()
            print(f"success: {result.get('status')}")
            return result
        else:
            print(f"failed: {response.status_code}")
            print(f"response: {response.text}")
            return None
            
    except Exception as e:
        print(f"error: {e}")
        return None

if __name__ == "__main__":
    # GAS WebApp URL
    gas_url = "https://script.google.com/macros/s/AKfycbys_1sl065_wV_0RusA_aIOxtA3HUuqizsItE7q8g6Qq9vyrd836MtfSKtc5oRh0PRCcA/exec"
    
    # 全機体データを取得
    print("Getting all machines data...")
    all_data = get_data_from_gas(gas_url, "getAllMachines")
    if all_data:
        print(f"Total machines: {all_data.get('totalMachines')}")
        for machine in all_data.get('machines', []):
            print(f"Machine {machine.get('machineId')}: {len(machine.get('data', []))} records")
    
    print("\n" + "="*50 + "\n")
    
    # 特定機体のデータを取得
    machine_id = "004353"
    print(f"Getting data for machine {machine_id}...")
    machine_data = get_data_from_gas(gas_url, "getMachine", machine_id)
    if machine_data:
        print(f"Machine {machine_id}: {machine_data.get('dataCount')} records")
        # 最新5件のデータを表示
        data_list = machine_data.get('data', [])
        if data_list:
            print("Latest 5 records:")
            for record in data_list[-5:]:
                print(f"  {record.get('timestamp')} - GPS: {record.get('latitude')}, {record.get('longitude')}")
    
    print("\n" + "="*50 + "\n")
    
    # 機体リストを取得
    print("Getting machine list...")
    machine_list = get_data_from_gas(gas_url, "getMachineList")
    if machine_list:
        print(f"Total machines: {machine_list.get('totalMachines')}")
        for machine in machine_list.get('machines', []):
            print(f"Machine {machine.get('machineId')}: {machine.get('dataCount')} records, last update: {machine.get('lastUpdate')}")