# Coding Conventions

このドキュメントは、Machine Tracker Web アプリケーションのコーディング規約をまとめたものです。一貫性のある、保守しやすいコードベースを維持するために、これらの規約に従ってください。

## 📁 プロジェクト構造

```
vehicle-tracker/
├── src/
│   ├── api/             # API通信層
│   ├── components/      # Reactコンポーネント
│   │   ├── auth/       # 認証関連
│   │   ├── features/   # 機能別コンポーネント
│   │   ├── map/        # 地図関連
│   │   └── ui/         # 共通UIコンポーネント
│   ├── constants/       # 定数定義
│   ├── hooks/          # カスタムフック
│   ├── store/          # Zustand状態管理
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
└── public/             # 静的ファイル
```

## 🎨 TypeScript / React

### 基本原則

- **TypeScript strict mode** を使用（`tsconfig.json` で `"strict": true`）
- **関数コンポーネント** を使用（クラスコンポーネントは使用しない）
- **Named export** を優先（default export は App.tsx などの例外のみ）
- **絶対パス** を使用してファイルパスを指定
- **言語** は　 UI にはすべて英語を使用（例: `MachineTracker`、`TelemetryDataPoint`），コメントも英語で記述．ドキュメントのみ日本語を使用

### 型定義

```typescript
// ✅ Good - インターフェースを使用
export interface TelemetryDataPoint {
  timestamp: string;
  machineTime?: string;
  machineId: string;
  dataType?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  battery?: number;
  comment?: string;
}

// ✅ Good - 明示的な型付け
export const MapContainer: React.FC = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // ...
};

// ❌ Bad - any型の使用
const data: any = fetchData();
```

### コンポーネント

```typescript
// ✅ Good - 関数コンポーネント + 型定義
import React from 'react';

interface MachineMarkerProps {
  machineId: string;
  position: google.maps.LatLngLiteral;
  isSelected: boolean;
  onClick: () => void;
}

export const MachineMarker: React.FC<MachineMarkerProps> = ({
  machineId,
  position,
  isSelected,
  onClick,
}) => {
  // コンポーネントロジック
  return <div>...</div>;
};

// ❌ Bad - PropTypes の使用
MachineMarker.propTypes = { ... };
```

### フック

```typescript
// ✅ Good - カスタムフックは use で始まる
export const useMachineData = () => {
  const [data, setData] = useState<MachineTracks>({});
  // フックロジック
  return { data, isLoading, error };
};

// ✅ Good - 依存配列を明示的に指定
useEffect(() => {
  // エフェクトロジック
}, [dependency1, dependency2]);
```

## 🎯 状態管理 (Zustand)

```typescript
// ✅ Good - 型付きストア
interface AppState {
  machineTracks: MachineTracks;
  selectedMachineId: string | null;
  // アクション
  setSelectedMachine: (machineId: string | null) => void;
  // 計算されたゲッター
  getMachineIds: () => string[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初期状態
  machineTracks: {},
  selectedMachineId: null,

  // アクション
  setSelectedMachine: (machineId) => set({ selectedMachineId: machineId }),

  // ゲッター
  getMachineIds: () => Object.keys(get().machineTracks),
}));
```

## 🎨 スタイリング

### Tailwind CSS

```tsx
// ✅ Good - Tailwind クラスを使用
<div className="min-h-screen bg-dark-bg">
  <div className="card p-3 mb-2">
    <h1 className="text-lg font-bold text-dark-text">Machine Tracker</h1>
  </div>
</div>

// ✅ Good - カスタムカラー定義（tailwind.config.js）
colors: {
  dark: {
    bg: '#0d1117',
    surface: '#161b22',
    accent: '#58a6ff',
    text: '#c9d1d9',
    muted: '#8b949e',
  }
}

// ❌ Bad - インラインスタイル
<div style={{ backgroundColor: '#0d1117' }}>...</div>
```

### レスポンシブデザイン

```tsx
// ✅ Good - Tailwind のレスポンシブユーティリティ
<div className="hidden md:block">      {/* タブレット以上で表示 */}
<div className="text-xs lg:text-sm">   {/* デスクトップで文字サイズ変更 */}
<div className="p-2 sm:p-3">           {/* モバイルで余白調整 */}
```

## 📦 インポート順序

```typescript
// 1. React / 外部ライブラリ
import React, { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Info, Wifi, WifiOff } from "lucide-react";

// 2. 内部コンポーネント（相対的な深さ順）
import { MachineTabs } from "./components/features/MachineTabs";
import { MapContainer } from "./components/map/MapContainer";

// 3. フック
import { useMachineData } from "./hooks/useMachineData";

// 4. ストア / 状態
import { useAppStore } from "./store";

// 5. ユーティリティ / ヘルパー
import { exportToCSV, exportToJSON } from "./utils/export";

// 6. 定数
import { DEFAULT_MAP_OPTIONS } from "./constants/map";

// 7. 型定義
import type { TelemetryDataPoint } from "./types";
```

## 🔧 API / データフェッチング

### SWR を使用したデータフェッチング

```typescript
// ✅ Good - カスタムフック + エラーハンドリング
export const useMachineData = () => {
  const { data, error, isLoading } = useSWR<GASResponse>(
    isPaused ? null : "getAllMachines",
    fetcher,
    {
      refreshInterval: refreshInterval * 1000,
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    machineTracks: processedData,
    error,
    isLoading,
  };
};
```

### エラーハンドリング

```typescript
// ✅ Good - カスタムエラークラス
export class GASApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "GASApiError";
  }
}

// ✅ Good - try-catch でエラー処理
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new GASApiError("API request failed", response.status);
  }
} catch (error) {
  console.error("Export failed:", error);
  // ユーザーフレンドリーなエラー表示
}
```

## 🗂️ ファイル命名規則

- **コンポーネント**: PascalCase（例: `MapContainer.tsx`）
- **フック**: camelCase（例: `useMachineData.ts`）
- **ユーティリティ**: camelCase（例: `gradientColors.ts`）
- **定数**: camelCase または UPPER_SNAKE_CASE（例: `map.ts`, `DEFAULT_MAP_OPTIONS`）
- **型定義**: PascalCase（例: `TelemetryDataPoint`）

## 💡 ベストプラクティス

### パフォーマンス最適化

```typescript
// ✅ Good - メモ化
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// ✅ Good - コールバックの最適化
const handleClick = useCallback(() => {
  // ハンドラーロジック
}, [dependency]);

// ✅ Good - 条件付きレンダリング
{
  selectedDataPoint && <SidePanel />;
}
```

### アクセシビリティ

```tsx
// ✅ Good
<button
  onClick={logout}
  className="btn btn-secondary"
  title="Logout"
  aria-label="ログアウト"
>
  <LogOut size={14} />
</button>
```

### エクスポート

```typescript
// ✅ Good - Named export
export const MapContainer: React.FC = () => { ... };
export const useMachineData = () => { ... };

// ❌ Bad - Default export（App.tsx 以外）
export default MapContainer;
```

## 🔒 セキュリティ

- 環境変数は `.env` ファイルで管理（`.env.example` を参照）
- API キーや認証情報をコードに直接記述しない
- ユーザー入力は必ず検証・サニタイズする

## 📝 コメント

```typescript
// ✅ Good - 必要な場合のみ、理由を説明
// Auto-center logic based on view mode
useEffect(() => {
  // Fit bounds to show all machines
  if (viewMode === "all") {
    // ...
  }
}, [viewMode]);

// ❌ Bad - 自明なコメント
// Set loading to true
setLoading(true);
```

## 🧪 テスト（将来的な実装）

```typescript
// テストファイル名: ComponentName.test.tsx
// 例: MapContainer.test.tsx

describe("MapContainer", () => {
  it("should render without crashing", () => {
    // テストロジック
  });
});
```

## 📚 ドキュメント

- コンポーネントの複雑なロジックには JSDoc コメントを追加
- 新機能は `docs/` ディレクトリにドキュメントを作成
- README を最新の状態に保つ

## 🚀 Git コミットメッセージ

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイルの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスや補助ツールの変更
```

例:

```
feat: Add gradient visualization for telemetry parameters
fix: Resolve memory leak in map marker rendering
docs: Update authentication setup instructions
```
