# GAS Telemetry System Tests

このディレクトリには GAS バックエンドの動作を検証するための Python テストスクリプトが含まれています。

## セットアップ

```bash
cd tests
pip install -r requirements.txt
```

## テストスクリプト

すべてのテストは `../examples/python/` ディレクトリにあります：

```bash
cd ../examples/python

# 基本機能テスト
python simple_sender.py          # 基本送信テスト
python simple_getter.py          # 基本取得テスト
python register_machine.py       # 機体登録テスト

# 高機能テスト
python test_sender.py            # 詳細送信テスト
python test_api_compatibility.py # API互換性テスト
python test_notification_system.py # 通知システムテスト
python test_realistic_scenario.py  # リアルシナリオテスト
python test_timeout_simulation.py  # タイムアウトテスト
python test_quick_setup.py         # クイックセットアップテスト
```

## 必要な環境変数

テスト実行前に以下を設定：

```bash
export GAS_WEBAPP_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

または各テストファイル内の URL を直接編集してください。