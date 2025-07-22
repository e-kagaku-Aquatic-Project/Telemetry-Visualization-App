# 機体追跡可視化 WebApp

リアルタイム機体追跡・センサーデータ監視のためのReact WebApplicationです。

## 🚀 クイックスタート

### 前提条件
- Node.js 18以上
- npm (Node.jsに含まれます)
- Google Maps API キー
- Google Apps Script (GAS) エンドポイント

### セットアップ
```bash
# 1. 依存関係のインストール
npm install

# 2. 環境設定ファイルの作成
cp .env.example .env

# 3. .envファイルを編集して以下を設定
VITE_GMAPS_API_KEY=your_google_maps_api_key
VITE_GAS_ENDPOINT=your_gas_endpoint_url
VITE_APP_PASSWORD=your_secure_password
```

### 開発・実行コマンド
```bash
npm run dev      # 開発サーバー起動 (http://localhost:4000)
npm run build    # 本番用ビルド
npm run preview  # ビルド結果のプレビュー
npm run lint     # コード品質チェック
```

## 🏗️ 技術仕様

### アーキテクチャ概要
```
[機体センサー] → [Google Apps Script] → [React WebApp] → [ユーザー]
```

### 技術スタック
- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Webpack 5 (開発サーバー: webpack-dev-server)
- **状態管理**: Zustand (軽量Redux代替)
- **データ取得**: SWR (HTTP Client + キャッシング)
- **UI**: Tailwind CSS + Framer Motion
- **マップ**: Google Maps JavaScript API
- **グラフ**: Recharts
- **エクスポート**: PapaParse (CSV/JSON)

### プロジェクト構造
```
src/
├── components/           # Reactコンポーネント
│   ├── auth/            # 認証関連コンポーネント
│   ├── features/        # 機能特化コンポーネント
│   │   ├── MachineTabs.tsx      # 機体タブ切り替え
│   │   ├── SensorGraphs.tsx     # センサーグラフ表示
│   │   ├── GradientLegend.tsx   # グラデーション凡例
│   │   └── PredictionControls.tsx # 予測機能制御
│   ├── map/             # マップ関連コンポーネント
│   │   ├── MapContainer.tsx         # メインマップコンテナ
│   │   ├── MachineMarker.tsx        # 機体位置マーカー
│   │   ├── WaypointMarker.tsx       # 経過点マーカー
│   │   ├── TrackPolyline.tsx        # 基本軌跡線
│   │   ├── DirectGradientPolyline.tsx # グラデーション軌跡線
│   │   ├── PredictionMarker.tsx     # 位置予測マーカー
│   │   └── GradientMapOverlay.tsx   # グラデーションオーバーレイ
│   └── ui/              # 汎用UIコンポーネント
│       ├── TopBar.tsx           # ヘッダーバー
│       ├── StatusBar.tsx        # ステータスバー
│       ├── SidePanel.tsx        # 詳細情報パネル
│       └── ViewToggle.tsx       # ビュー切り替え
├── hooks/               # カスタムReactフック
│   ├── useMachineData.ts        # 機体データ取得・管理
│   └── useKeyboardShortcuts.ts  # キーボードショートカット
├── store/               # グローバル状態管理
│   └── index.ts         # Zustand ストア定義
├── utils/               # ユーティリティ関数
│   ├── auth.ts          # 認証処理
│   ├── export.ts        # データエクスポート
│   ├── gradientColors.ts # グラデーション色計算
│   └── prediction.ts    # 位置予測計算
├── types/               # TypeScript型定義
│   └── index.ts         # アプリケーション型定義
├── constants/           # 定数定義
│   └── map.ts           # マップスタイル・設定
├── api/                 # API通信
│   └── gas.ts           # Google Apps Script API
├── App.tsx              # メインアプリケーション
├── main.tsx             # エントリーポイント
├── index.css            # グローバルスタイル
└── App.css              # アプリケーション専用スタイル
```

## 📊 データフロー

### 1. データ取得フロー
```typescript
// SWRによる自動データ取得・リフレッシュ
useMachineData() → GAS API → Zustand Store → React Components
```

### 2. 状態管理パターン
```typescript
// Zustand による集中状態管理
interface AppState {
  machineTracks: MachineTracks;        // 機体軌跡データ
  selectedMachineId: string | null;    // 選択中機体
  gradientVisualization: GradientVisualizationState;
  predictionConfig: PredictionConfig;
  connectionStatus: ConnectionStatus;
}
```

### 3. API通信仕様
```typescript
// Google Apps Script エンドポイント
GET ?action=getAllMachines     // 全機体データ
GET ?action=getMachine&id=XXX  // 特定機体データ
GET ?action=getMachineList     // 機体一覧
```

## 🎨 UI/UX仕様

### レスポンシブデザイン
- **デスクトップ (1280px+)**: 固定サイドパネル + マップ
- **タブレット (1024-1279px)**: オーバーレイパネル + マップ  
- **モバイル (~1023px)**: フルスクリーンマップ + モーダルパネル

### テーマ設計
アプリケーションは**ダークモード**と**ライトモード**の両方をサポートしています。

#### ダークテーマ（GitHub風）
```scss
--dark-bg: #0d1117;       // メイン背景色
--dark-surface: #161b22;  // カード・パネル背景
--dark-accent: #58a6ff;   // アクセントカラー (青)
--dark-text: #c9d1d9;     // メインテキスト
--dark-muted: #8b949e;    // 補助テキスト
```

#### ライトテーマ（GitHub風）
```scss
--light-bg: #ffffff;      // メイン背景色
--light-surface: #f6f8fa; // カード・パネル背景
--light-accent: #0969da;  // アクセントカラー (青)
--light-text: #1f2328;    // メインテキスト
--light-muted: #656d76;   // 補助テキスト
```

#### テーマ切り替え機能
- **切り替え方法**: ヘッダー右上の太陽/月アイコン、またはログイン画面のトグルボタン
- **自動保存**: 選択したテーマはlocalStorageに保存され、次回起動時に復元
- **対応範囲**: UI全体（マップスタイル、グラフ、パネル、コンポーネント）

### キーボードショートカット
| キー | 機能 |
|------|------|
| `1-9` | 機体選択 |
| `[` / `]` | 機体切り替え |
| `P` | 更新の一時停止/再開 |
| `E` | データエクスポート |
| `ESC` | パネル閉じる |

## ⚙️ 機能仕様

### 1. リアルタイム追跡
- **更新間隔**: 5秒〜60秒 (設定可能)
- **自動フェッチ**: SWRによるバックグラウンド更新
- **エラーハンドリング**: 自動リトライ + 接続状態表示

### 2. 地図表示機能
- **テーマ対応マップ**: ダークモード（黒基調）/ ライトモード（白基調）
- **自動スタイル切り替え**: テーマ変更時にマップも自動で再描画
- **自動中心移動**: 機体選択時の地図追従
- **ズーム制御**: 全機体表示 ↔ 個別機体詳細

### 3. 軌跡可視化
- **基本軌跡**: シンプルな移動履歴線
- **グラデーション軌跡**: パラメータ連動色変化
  - 対応パラメータ: 高度、衛星数、バッテリー
  - リアルタイム色計算・更新

### 4. 位置予測機能
```typescript
interface PredictionConfig {
  isEnabled: boolean;
  predictionMinutes: number;    // 1-60分
  referencePoints: number;      // 2-10点
}

// Haversine公式による球面距離計算
// 線形外挿による位置予測
```

### 5. データエクスポート
- **CSV形式**: Excel互換
- **JSON形式**: プログラム処理用
- **エクスポート範囲**: 個別機体 / 全機体

### 6. 認証システム
- **パスワード認証**: 設定可能なアクセス制御
- **セッション管理**: 24時間自動期限切れ
- **ローカルストレージ**: セッション情報の永続化

## 🔧 開発ガイド

### 新機能追加手順

#### 1. コンポーネント追加
```typescript
// 1. 適切なディレクトリに配置
src/components/features/NewFeature.tsx

// 2. 型定義の追加
src/types/index.ts

// 3. 状態管理への統合
src/store/index.ts
```

#### 2. APIエンドポイント追加
```typescript
// 1. GAS側の実装
// 2. TypeScript型定義
// 3. APIクライアント更新
src/api/gas.ts
```

### コーディング規約
- **TypeScript**: strict mode使用
- **インポート順序**: React → サードパーティ → 内部モジュール
- **コンポーネント命名**: PascalCase
- **ファイル命名**: camelCase

### パフォーマンス最適化
```typescript
// 1. React.memo による無駄な再レンダー防止
export const MachineMarker = React.memo<Props>(({ ... }) => {
  // ...
});

// 2. useMemo によるコンピューテッド値キャッシュ
const expensiveValue = useMemo(() => calculateHeavyOperation(data), [data]);

// 3. マーカー数制限 (最大10個の経過点)
const limitedWaypoints = waypoints.slice(-10);
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. ビルドエラー
```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュクリア
npm run build
```

#### 2. 環境変数が読み込まれない
```bash
# .envファイルの確認
cat .env

# Webpack設定の確認
# import.meta.env.VITE_* の形式で定義されているか
```

#### 3. Maps API エラー
- APIキーの有効性確認
- APIキーの制限設定確認
- 課金アカウントの有効化確認

### ログ・デバッグ
```typescript
// 1. Zustand DevTools
useAppStore.getState() // 現在の状態確認

// 2. SWR DevTools
// データ取得状態の監視

// 3. Network タブ
// GAS APIレスポンスの確認
```

## 🚀 デプロイメント

### 本番ビルド
```bash
npm run build
# dist/ フォルダが生成される
```

### デプロイ先選択肢
1. **Vercel** (推奨)
2. **Netlify**
3. **GitHub Pages**
4. **静的ホスティング**

### 環境変数設定
デプロイ時に以下を設定:
```
VITE_GMAPS_API_KEY=production_key
VITE_GAS_ENDPOINT=production_gas_url  
VITE_APP_PASSWORD=production_password
```

## 📊 データスキーマ

### 機体テレメトリーデータ
```typescript
interface TelemetryDataPoint {
  timestamp: string;        // ISO 8601形式の時刻
  machineTime?: string;     // 機体側の時刻
  machineId: string;        // 機体識別子
  dataType?: string;        // データタイプ
  latitude: number;         // 緯度（度）
  longitude: number;        // 経度（度）
  altitude: number;         // 高度（メートル）
  satellites: number;       // GPS衛星数
  battery?: number;         // バッテリー残量（%）
  comment?: string;         // コメント・注記
}
```

**注意**: 水温、気圧、気温センサーは将来実装予定です。

## 📝 更新履歴

### v2.1.0 (最新)
- ✅ ディレクトリ構造の最適化
- ✅ Vite → Webpack 完全移行
- ✅ 不要ファイルの削除・クリーンアップ
- ✅ ESモジュール対応
- ✅ インポートパスの統一
- ✅ 技術仕様書READMEの全面改訂
- ✅ **ダーク/ライトテーマ機能**: 完全対応（UI、マップ、グラフ全て）
- ✅ **テーマ自動保存**: localStorage連携でユーザー設定永続化

### v2.0.0
- ✅ Vehicle → Machine 用語統一
- ✅ 認証システム実装
- ✅ 位置予測機能追加
- ✅ グラデーション可視化改善

## 👤 開発者情報

**Created by**: Shintaro Matsumoto  
**Repository**: 機体追跡可視化 WebApp  
**License**: MIT

---
**Note**: このREADMEは技術仕様書として作成されており、開発・保守の参考資料として使用してください。