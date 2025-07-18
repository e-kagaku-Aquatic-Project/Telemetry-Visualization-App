# Telemetry-Visualization-App

リアルタイム機体追跡 Web アプリケーション - Google Maps を使って機体の位置とセンサーデータを可視化します。

## 🚀 初期環境設定（必須）

このリポジトリをクローンした後、以下の手順で環境を構築してください。

### 1. 必要なソフトウェア

- **Node.js 18 以上** - [nodejs.org](https://nodejs.org/) からダウンロード
- **npm** (Node.js に含まれています)
- **Google Maps API キー** - [Google Cloud Console](https://console.cloud.google.com/)で取得

### 2. プロジェクトのセットアップ

```bash
# 1. このリポジトリをクローン
git clone <repository-url>
cd vehicle-tracker

# 2. 必要なライブラリをインストール
npm install

# 3. 環境設定ファイルを作成
cp .env.example .env
```

### 3. API キーの設定

`.env`ファイルを編集して以下を設定：

```bash
# Google Maps APIキー（必須）
VITE_GMAPS_API_KEY=your_google_maps_api_key_here

# データ取得先のGoogle Apps Script URL（必須）
VITE_GAS_ENDPOINT=your_google_apps_script_web_app_url_here
```

(GAS もデプロイしてね`SpreadSheets_GAS.gs`をスプレットシートの拡張機能の GAS のところに貼り付ける)

### 4. アプリケーションの起動

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:4000 にアクセス
```

### 5. 本番用ビルド（オプション）

```bash
# 本番用にビルド
npm run build

# ビルドした結果をプレビュー
npm run preview
```

---

## 📖 技術仕様書（エンジニア向け）

### システム概要

この Web アプリケーションは、機体のリアルタイム位置追跡とセンサーデータ監視を行います。機体に搭載された GPS とセンサーからのデータを Web ブラウザ上の地図に表示し、運行状況を可視化します。

### アーキテクチャ

```
[機体センサー] → [Google Sheets + GAS] → [React Webアプリ] → [ユーザー]
```

1. **データ収集層**: 機体の GPS・センサーデータを Google Sheets に蓄積（機体ごとに個別シート作成）
2. **API 層**: Google Apps Script (GAS) が REST API としてデータを提供
3. **表示層**: React Web アプリがリアルタイムでデータを取得・表示

### 主要コンポーネント

**Google Apps Script バックエンド (version 2.0.0)**:
- `doGet()`: API リクエスト処理 (`getAllMachines`, `getMachine`, `getMachineList`)
- `doPost()`: テレメトリーデータ受信・保存処理
- 機体別シート自動作成 (`Machine_{machineId}`)
- 標準化されたデータヘッダー管理

**React フロントエンド**:
- **状態管理**: Zustand ストア (`src/store/index.ts`)
- **データフェッチ**: SWR + カスタムフック (`src/hooks/useMachineData.ts`)
- **地図統合**: Google Maps API (`@react-google-maps/api`)
- **グラデーション可視化**: `DirectGradientPolyline` コンポーネント
- **アニメーション**: Framer Motion

### 主要技術スタック

- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Webpack 5（webpack-dev-server for development）
- **スタイリング**: Tailwind CSS（GitHub風ダークテーマ）
- **地図表示**: Google Maps JavaScript API
- **状態管理**: Zustand（軽量 Redux 代替）
- **データ取得**: SWR（自動リフレッシュ付き HTTP クライアント）
- **アニメーション**: Framer Motion
- **データエクスポート**: PapaParse（CSV/JSON）
- **エラーハンドリング**: カスタム `GASApiError` クラス

### 機能仕様

#### 🗺️ 地図表示機能

- **リアルタイム位置表示**: 機体の現在位置をマーカーで表示
- **移動軌跡**: 過去の移動履歴をカラフルな線で描画
- **経過点表示**: 選択した機体の詳細な移動経路を点で表示
- **自動追従**: 機体選択時に地図が自動的に中心移動

#### 📊 センサーデータ表示

- **GPS 情報**: 緯度経度、高度、衛星数
- **環境センサー**: 水温、気圧、気温
- **システム情報**: バッテリー残量、機体時刻
- **メタデータ**: データタイプ、コメント
- **タイムスタンプ**: データ取得時刻
- **Raw JSON データ**: 技術者向け詳細情報

#### 🎨 グラデーション軌跡表示

- **パラメータ連動**: 水温、気温、気圧、高度に基づく軌跡の色変化
- **リアルタイム更新**: パラメータ切り替え時の軌跡再描画
- **パフォーマンス最適化**: DirectGradientPolyline による効率的な描画

#### 🔮 位置予測機能

- **予測アルゴリズム**: 過去の移動データに基づく線形予測
- **設定可能パラメータ**: 予測時間（1-60分）、参照ポイント数（2-10点）
- **予測精度**: 速度と方向の一貫性に基づく自動計算
- **視覚化**: 予測位置マーカーと現在位置からの予測軌跡

#### ⚡ リアルタイム更新

- **自動更新**: 5 秒〜60 秒間隔で設定可能
- **接続状態監視**: データ取得の成功/失敗状況を表示
- **エラー処理**: 接続障害時の自動リトライ機能

#### 💾 データエクスポート

- **CSV 形式**: Excel 等で開ける形式でデータ出力
- **JSON 形式**: プログラム処理用のデータ形式
- **選択エクスポート**: 特定機体または全機体データ

#### 🎮 操作性

- **キーボードショートカット**: 素早い機体切り替え（1-9 キー、矢印キー等）
- **レスポンシブ対応**: PC・タブレット・スマートフォンで最適表示
- **タッチ操作**: モバイルデバイスでの直感的操作
- **予測制御**: 個別機体表示時の予測機能オン/オフ切り替え

### データフォーマット

#### 機体テレメトリーデータ

```typescript
interface TelemetryDataPoint {
  timestamp: string; // ISO 8601形式の時刻
  machineTime?: string; // 機体側の時刻
  machineId: string; // 機体識別子
  dataType?: string; // データタイプ
  latitude: number; // 緯度（度）
  longitude: number; // 経度（度）
  altitude: number; // 高度（メートル）
  satellites: number; // GPS衛星数
  waterTemperature: number; // 水温（摂氏）
  airPressure: number; // 気圧（hPa）
  airTemperature: number; // 気温（摂氏）
  battery?: number; // バッテリー残量（%）
  comment?: string; // コメント・注記
}
```

#### データフォーマット仕様

**重要**: POST と GET でデータ構造が異なります：
- **POST（GAS への送信）**: ネストされた構造（`GPS.LAT`, `sensors.water_temperature`）
- **GET（GAS からの取得）**: フラットな構造（`latitude`, `waterTemperature`）

GAS バックエンドがフォーマット変換を自動処理します。

### API エンドポイント仕様

Google Apps Script は以下のエンドポイントを提供します：

- `GET ?action=getAllMachines` - 全機体の最新データ取得
- `GET ?action=getMachine&machineId=XXX` - 特定機体の履歴データ取得
- `GET ?action=getMachineList` - 機体一覧取得

**注意**: バージョン 2.0.0 で vehicle → machine に統一されました。

### パフォーマンス最適化

- **マーカー制限**: 経過点表示を最大 10 個に制限してレンダリング負荷軽減
- **データ間引き**: 非選択機体は 10 番目ごとにポイント表示
- **メモリ管理**: 不要なイベントハンドラーのクリーンアップ
- **バンドルサイズ**: Webpack によるコード分割と minification

### セキュリティ

- **API キー保護**: 環境変数による機密情報の管理
- **CORS 対応**: 適切なオリジン制限
- **XSS 対策**: React 標準のエスケープ処理

---

## 📱 ユーザー操作ガイド

### 基本操作

| 操作               | 方法                                |
| ------------------ | ----------------------------------- |
| 機体選択           | 上部タブクリックまたは 1-9 キー     |
| 機体切り替え       | `[` / `]` キーまたは矢印キー        |
| データ更新間隔変更 | 右上の「Refresh」ドロップダウン     |
| 更新一時停止       | `P`キーまたは「Pause」ボタン        |
| データエクスポート | `E`キーまたは下部エクスポートボタン |
| センサー詳細表示   | マーカークリックまたは情報ボタン    |
| 詳細パネル閉じる   | `ESC`キーまたは × ボタン            |

### レスポンシブデザイン

- **デスクトップ（1280px 以上）**: 地図＋固定サイドパネル
- **タブレット（1024px-1279px）**: 地図メイン＋オーバーレイパネル
- **モバイル（1023px 以下）**: フルスクリーン地図＋オーバーレイパネル

---

## 🔧 Google Apps Script 設定

データ提供用の Google Apps Script は以下のエンドポイントをサポートする必要があります：

### 必要な API エンドポイント

- `GET ?action=getAllMachines` - 全機体の最新データを返す
- `GET ?action=getMachine&machineId=機体ID` - 特定機体の履歴データを返す
- `GET ?action=getMachineList` - 利用可能な機体の一覧を返す

**注意**: バージョン 2.0.0 で vehicle → machine に統一されました。

### データ形式仕様

Google Apps Script が返す JSON データの形式：

```json
{
  "status": "success",
  "timestamp": "2025-06-16T12:00:00.000Z",
  "machines": [
    {
      "machineId": "DRONE_001",
      "data": [
        {
          "timestamp": "2025-06-16T12:00:00.000Z",
          "machineTime": "2025-06-16T12:00:00.000Z",
          "machineId": "DRONE_001",
          "dataType": "telemetry",
          "latitude": 35.6762,
          "longitude": 139.6503,
          "altitude": 120.5,
          "satellites": 8,
          "waterTemperature": 22.3,
          "airPressure": 1013.25,
          "airTemperature": 25.1,
          "battery": 85,
          "comment": "正常運行中"
        }
      ]
    }
  ]
}
```

---

## 🏗️ プロジェクト構造

```
src/
├── api/               # データ取得API層
├── components/        # React UIコンポーネント
│   ├── TopBar.tsx    # ヘッダー（更新間隔設定等）
│   ├── MachineTabs.tsx # 機体選択タブ
│   ├── MapContainer.tsx # Google Maps表示
│   ├── MachineMarker.tsx # 機体位置マーカー
│   ├── WaypointMarker.tsx # 経過点マーカー
│   ├── DirectGradientPolyline.tsx # パラメータ連動軌跡線
│   ├── SidePanel.tsx # センサー詳細パネル
│   └── StatusBar.tsx # 接続状態・エクスポート
├── hooks/            # カスタムReactフック
│   └── useMachineData.ts # 機体データ取得フック
├── store/            # グローバル状態管理（Zustand）
├── types/            # TypeScript型定義
├── utils/            # ユーティリティ関数
├── constants/        # 設定定数（map.ts でカスタムスタイル）
└── assets/           # 静的ファイル

**注意**: バージョン 2.0.0 で Vehicle → Machine に完全移行済み
```

---

## ⚙️ カスタマイズ

### 地図スタイルの変更

`src/constants/map.ts`の`MONOCHROME_MAP_STYLE`を編集することで、地図の見た目をカスタマイズできます。

### 更新間隔の変更

`src/components/TopBar.tsx`の`intervalOptions`配列を編集することで、データ更新間隔の選択肢を変更できます。

### グラデーション軌跡の設定

`DirectGradientPolyline`コンポーネントで、パラメータ（水温、気温、気圧、高度）に基づく軌跡の色変化を設定できます。

### 位置予測機能の設定

予測機能は個別機体表示時に右上の「Prediction」コントロールから設定できます：

- **予測時間**: 1, 2, 5, 10, 15, 30, 60分から選択
- **参照ポイント数**: 2, 3, 4, 5, 6, 8, 10点から選択（データ量に応じて制限）
- **表示制御**: 予測表示のオン/オフ切り替え

### 色テーマの変更

`tailwind.config.js`でダークテーマの色を設定しています：

- Background: `#0d1117` (GitHub 風ダークグレー)
- Surface: `#161b22` (カード背景色)
- Accent: `#58a6ff` (アクセントブルー)
- Text: `#c9d1d9` (メインテキスト色)

---

## 🚀 デプロイ

### 本番ビルド

```bash
npm run build
```

### Vercel/Netlify へのデプロイ

1. GitHub リポジトリを Vercel/Netlify に接続
2. 環境変数を設定：
   - `VITE_GMAPS_API_KEY`
   - `VITE_GAS_ENDPOINT`
3. 自動デプロイが開始されます

---

## 🧑‍💻 開発者向け情報

### コード品質

- TypeScript strict mode 使用
- ESLint 設定済み
- 統一的なコーディングスタイル

### ビルドコマンド

```bash
npm run build    # 本番用ビルド（Webpack）
npm run lint     # コード品質チェック（ESLint）
npm run preview  # ビルド結果のプレビュー（serve）
npm run dev      # 開発サーバー起動（webpack-dev-server）
```

### 最近の主要変更

- **Vehicle → Machine 移行**: 全 API エンドポイント、コンポーネント、データ構造を機体中心に統一
- **GAS バックエンド v2.0.0**: 新フィールド（battery、comment、dataType、machineTime）追加
- **グラデーション軌跡**: `DirectGradientPolyline` による効率的なパラメータ連動可視化
- **位置予測機能**: 過去の移動データに基づく将来位置の予測表示
- **Webpack ビルドシステム**: Vite から Webpack に移行、TypeScript は Babel で処理

### 位置予測技術仕様

#### アルゴリズム概要

位置予測機能は、機体の過去の移動履歴を分析して将来の位置を予測します。

#### 予測手法

1. **データ収集**: 設定された参照ポイント数（2-10点）の最新データを使用
2. **ベクトル計算**: 連続する位置間の距離、方向、時間間隔を計算
3. **平均化処理**: 時間重み付き平均により平均速度と方向を算出
4. **予測計算**: 線形外挿により指定時間後の位置を予測

#### 技術的詳細

**距離計算**: Haversine 公式による球面距離計算
```javascript
const R = 6371; // 地球の半径（km）
const distance = R * c; // 球面距離
```

**方向計算**: 2点間の方位角計算
```javascript
const bearing = Math.atan2(y, x) * 180 / Math.PI;
const normalizedBearing = (bearing + 360) % 360;
```

**予測位置**: 現在位置から予測距離・方向への移動
```javascript
const predictionDistance = (avgSpeed * predictionMinutes) / 60;
const predictedPosition = calculateDestination(currentPos, distance, bearing);
```

#### 設定パラメータ

- **予測時間**: 1-60分（デフォルト: 5分）
- **参照ポイント数**: 2-10点（デフォルト: 2点）
- **最低データ要件**: 最低2つのデータポイントが必要

#### 予測精度要因

- **データ品質**: GPS精度、データ更新間隔
- **移動パターン**: 直線的な移動ほど高精度
- **環境要因**: 風、海流などの外的要因は考慮されない

#### 視覚的表現

- **予測マーカー**: 矢印型アイコン（移動方向に回転）
- **予測軌跡**: 現在位置から予測位置への点線
- **色分け**: 機体ごとの固有色を使用
- **透明度**: 固定透明度（0.7）で表示

---

## 📄 ライセンス

MIT License - 詳細は LICENSE ファイルを参照

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成
3. 変更を実装
4. テスト追加（該当する場合）
5. プルリクエストを送信
