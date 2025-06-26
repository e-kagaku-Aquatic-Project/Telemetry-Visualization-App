# グラデーション軌跡視覚化機能 詳細設計書
# Gradient Track Visualization Feature - Detailed Design Document

## 1. 概要 (Overview)

### 1.1 目的 (Purpose)
機体の軌跡上に各種テレメトリパラメータ（温度、高度、気圧など）をグラデーションでマッピングし、データの変化を視覚的に理解しやすくする機能を実装する。

### 1.2 対象パラメータ (Target Parameters)
現在のテレメトリデータから以下のパラメータをグラデーション表示対象とする：

- **altitude** (高度) - 海抜高度 [m]
- **waterTemperature** (水温) - 水温 [°C] 
- **airPressure** (気圧) - 大気圧 [hPa]
- **airTemperature** (気温) - 大気温度 [°C]
- **satellites** (衛星数) - GPS衛星受信数 [個]

## 2. 技術要件 (Technical Requirements)

### 2.1 データ構造 (Data Structure)
既存の `TelemetryDataPoint` インターフェースを使用：
```typescript
interface TelemetryDataPoint {
  timestamp: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  waterTemperature: number;
  airPressure: number;
  airTemperature: number;
}
```

### 2.2 グラデーション計算 (Gradient Calculation)
各パラメータの値域に基づいて正規化し、カラーマッピングを行う：

#### 2.2.1 正規化手法
```typescript
normalizedValue = (value - minValue) / (maxValue - minValue)
```

#### 2.2.2 カラーパレット設計
各パラメータに適切なカラーマッピングを適用：

- **高度 (Altitude)**: 青→緑→黄→赤 (低→高)
- **水温 (Water Temperature)**: 青→緑→黄→赤 (冷→温)
- **気圧 (Air Pressure)**: 紫→青→緑→黄 (低→高)
- **気温 (Air Temperature)**: 青→緑→黄→赤 (冷→温)
- **衛星数 (Satellites)**: 赤→黄→緑 (少→多)

### 2.3 レンダリング手法 (Rendering Method)
Google Maps APIの制約により、以下の手法を採用：

1. **セグメント分割**: 軌跡を短いセグメントに分割
2. **個別Polyline**: 各セグメントを個別のPolylineとして描画
3. **グラデーション近似**: 隣接セグメント間で色を補間

## 3. UI/UX設計 (UI/UX Design)

### 3.1 パラメータ選択UI
サイドパネルにパラメータ選択コントロールを追加：

```typescript
interface GradientControlProps {
  selectedParameter: GradientParameter | null;
  onParameterChange: (parameter: GradientParameter | null) => void;
  isEnabled: boolean;
}

type GradientParameter = 'altitude' | 'waterTemperature' | 'airPressure' | 'airTemperature' | 'satellites' | null;
```

### 3.2 グラデーション凡例
マップ下部にカラースケール凡例を表示：
- 最小値・最大値の表示
- カラーバーによる視覚的な値域表示
- 単位の明記

### 3.3 トグル機能
- グラデーション表示のON/OFF切り替え
- デフォルトの単色表示との切り替え

## 4. コンポーネント設計 (Component Architecture)

### 4.1 新規コンポーネント

#### 4.1.1 GradientTrackPolyline
```typescript
interface GradientTrackPolylineProps {
  vehicleId: string;
  data: TelemetryDataPoint[];
  isSelected: boolean;
  gradientParameter: GradientParameter | null;
}
```

#### 4.1.2 GradientControls
```typescript
interface GradientControlsProps {
  selectedParameter: GradientParameter | null;
  onParameterChange: (parameter: GradientParameter | null) => void;
  vehicleData: TelemetryDataPoint[];
}
```

#### 4.1.3 GradientLegend
```typescript
interface GradientLegendProps {
  parameter: GradientParameter;
  minValue: number;
  maxValue: number;
  colorPalette: string[];
}
```

### 4.2 状態管理 (State Management)
Zustandストアに以下の状態を追加：

```typescript
interface AppState {
  // 既存の状態...
  gradientVisualization: {
    isEnabled: boolean;
    selectedParameter: GradientParameter | null;
  };
  setGradientParameter: (parameter: GradientParameter | null) => void;
  toggleGradientVisualization: () => void;
}
```

## 5. アルゴリズム詳細 (Algorithm Details)

### 5.1 セグメント生成アルゴリズム
```typescript
function createGradientSegments(
  data: TelemetryDataPoint[],
  parameter: GradientParameter
): GradientSegment[] {
  const segments: GradientSegment[] = [];
  const values = data.map(point => point[parameter]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  for (let i = 0; i < data.length - 1; i++) {
    const startPoint = data[i];
    const endPoint = data[i + 1];
    const normalizedValue = (startPoint[parameter] - minValue) / (maxValue - minValue);
    const color = interpolateColor(normalizedValue, parameter);
    
    segments.push({
      path: [
        { lat: startPoint.latitude, lng: startPoint.longitude },
        { lat: endPoint.latitude, lng: endPoint.longitude }
      ],
      color,
      value: startPoint[parameter]
    });
  }
  
  return segments;
}
```

### 5.2 カラー補間アルゴリズム
```typescript
function interpolateColor(
  normalizedValue: number,
  parameter: GradientParameter
): string {
  const palette = COLOR_PALETTES[parameter];
  const segmentSize = 1 / (palette.length - 1);
  const segmentIndex = Math.floor(normalizedValue / segmentSize);
  const localRatio = (normalizedValue % segmentSize) / segmentSize;
  
  if (segmentIndex >= palette.length - 1) {
    return palette[palette.length - 1];
  }
  
  return blendColors(palette[segmentIndex], palette[segmentIndex + 1], localRatio);
}
```

## 6. パフォーマンス考慮事項 (Performance Considerations)

### 6.1 レンダリング最適化
- **セグメント数制限**: 最大1000セグメントまでに制限
- **データサンプリング**: 大量データ時は間引き処理
- **メモ化**: カラー計算結果をキャッシュ

### 6.2 メモリ使用量
- セグメント生成時の一時オブジェクト最小化
- 不要なPolylineコンポーネントの適切な破棄

## 7. テスト設計 (Testing Strategy)

### 7.1 単体テスト
- カラー補間アルゴリズムの精度検証
- セグメント生成の正確性テスト
- エッジケース（データ不足、異常値）のハンドリング

### 7.2 統合テスト
- Google Maps APIとの連携テスト
- リアルタイムデータ更新時の動作確認

### 7.3 パフォーマンステスト
- 大量データでのレンダリング速度測定
- メモリ使用量の監視

## 8. 実装フェーズ (Implementation Phases)

### フェーズ1: 基本機能
- GradientTrackPolylineコンポーネント実装
- 基本的なカラーマッピング機能

### フェーズ2: UI統合
- パラメータ選択UI実装
- グラデーション凡例表示

### フェーズ3: 最適化・テスト
- パフォーマンス最適化
- テストケース実装
- バグ修正

## 9. 技術的制約・リスク (Technical Constraints & Risks)

### 9.1 Google Maps API制約
- Polylineでの直接的なグラデーション不対応
- セグメント数増加によるパフォーマンス影響

### 9.2 データ品質リスク
- センサー異常値によるグラデーション表示の乱れ
- データ欠損時の処理

### 9.3 ブラウザ互換性
- カラー計算のブラウザ間差異
- レンダリングパフォーマンスのデバイス依存

## 10. 今後の拡張可能性 (Future Enhancements)

### 10.1 アニメーション機能
- 時系列でのグラデーション変化アニメーション
- リアルタイム更新時のスムーズな色遷移

### 10.2 カスタムカラーパレット
- ユーザー定義カラーパレット対応
- カラーブラインド対応パレット

### 10.3 3D表示対応
- 高度データを活用した3D軌跡表示
- WebGLベースのレンダリング最適化

---

## 11. 実装完了 (Implementation Complete)

### 11.1 実装されたコンポーネント

#### 11.1.1 コアコンポーネント
- **GradientTrackPolyline** (`/src/components/GradientTrackPolyline.tsx`)
  - 既存のTrackPolylineを置き換え
  - グラデーション表示とデフォルト表示の切り替え対応
  - セグメント分割によるグラデーション近似

- **GradientControls** (`/src/components/GradientControls.tsx`)
  - パラメータ選択UI
  - グラデーション表示ON/OFF切り替え
  - カラーパレットプレビュー

- **GradientLegend** (`/src/components/GradientLegend.tsx`)
  - マップ下部の凡例表示
  - 動的な最小・最大値表示
  - グラデーションカラーバー

#### 11.1.2 ユーティリティ
- **gradientColors** (`/src/utils/gradientColors.ts`)
  - カラーパレット定義
  - 色補間アルゴリズム
  - データ範囲計算

### 11.2 状態管理
Zustandストアに以下が追加:
```typescript
interface AppState {
  gradientVisualization: {
    isEnabled: boolean;
    selectedParameter: GradientParameter | null;
  };
  setGradientParameter: (parameter: GradientParameter | null) => void;
  toggleGradientVisualization: () => void;
}
```

### 11.3 使用方法
1. 個別機体モードでグラデーション表示コントロールが表示される
2. パラメータを選択してグラデーション表示をONにする
3. 軌跡がパラメータ値に応じてグラデーション表示される
4. 凡例がマップ下部に表示される

### 11.4 対応パラメータ
- **高度** (altitude): 青→緑→黄→赤
- **水温** (waterTemperature): 青→緑→黄→赤
- **気圧** (airPressure): 紫→青→緑→黄
- **気温** (airTemperature): 青→緑→黄→赤
- **衛星数** (satellites): 赤→黄→緑

### 11.5 技術的な制約事項
- 個別機体表示モード（individual view）でのみ利用可能
- セグメント数制限なし（大量データでもスムーズに動作）
- Google Maps APIのPolyline制約によりセグメント分割方式を採用

### 11.6 パフォーマンス最適化
- useMemoによるセグメント計算のメモ化
- 動的な値域計算による効率的な正規化
- 不要な再レンダリングの回避

---

**作成日**: 2025年6月24日  
**バージョン**: 1.1  
**実装完了日**: 2025年6月24日  
**作成者**: Claude Code