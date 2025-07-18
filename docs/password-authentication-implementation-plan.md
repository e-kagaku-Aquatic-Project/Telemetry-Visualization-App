# パスワード認証機能 実装計画書

## 実装手順

### 1. 環境設定の準備

#### 1.1 環境変数の追加
- `.env.example` にパスワード変数を追加
- `.env` ファイルの更新指示をREADMEに追記

```bash
# .env.example
VITE_GMAPS_API_KEY=your_google_maps_api_key
VITE_GAS_ENDPOINT=your_google_apps_script_web_app_url
VITE_APP_PASSWORD=your_secure_password  # 追加
```

### 2. 認証関連のユーティリティ実装

#### 2.1 認証ユーティリティ関数 (`src/utils/auth.ts`)
```typescript
// 簡易的なハッシュ化（本番環境では bcrypt 等を推奨）
export const hashPassword = (password: string): string => {
  // 簡易実装
};

export const verifyPassword = (inputPassword: string, hashedPassword: string): boolean => {
  // パスワード検証
};

export const generateSessionToken = (): string => {
  // セッショントークン生成
};

export const isSessionValid = (token: string, timestamp: number): boolean => {
  // セッション有効性チェック（24時間）
};
```

### 3. Zustand Store の拡張

#### 3.1 認証状態の追加 (`src/store/index.ts`)
```typescript
interface AuthSlice {
  isAuthenticated: boolean;
  sessionToken: string | null;
  sessionTimestamp: number | null;
  login: (password: string) => boolean;
  logout: () => void;
  checkAuthStatus: () => boolean;
  initializeAuth: () => void;
}
```

### 4. コンポーネントの実装

#### 4.1 ログインフォーム (`src/components/auth/LoginForm.tsx`)
- パスワード入力フィールド
- ログインボタン
- エラーメッセージ表示
- ローディング状態
- ダークテーマスタイリング

#### 4.2 PrivateRoute (`src/components/auth/PrivateRoute.tsx`)
- 認証チェック
- 未認証時のリダイレクト
- 子コンポーネントのレンダリング

#### 4.3 ログアウトボタン追加 (`src/components/TopBar.tsx` の修正)
- 既存のTopBarにログアウトボタンを追加
- アイコンとツールチップ

### 5. ルーティングの更新

#### 5.1 App.tsx の修正
```typescript
function App() {
  const { initializeAuth } = useStore();
  
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={
        <PrivateRoute>
          <MainApplication />
        </PrivateRoute>
      } />
    </Routes>
  );
}
```

### 6. スタイリング

#### 6.1 ログイン画面のCSS
- 既存のダークテーマと統一
- レスポンシブデザイン
- アニメーション（Framer Motion使用）

### 7. テストとデバッグ

#### 7.1 動作確認項目
- [ ] ログイン成功時の画面遷移
- [ ] 不正なパスワードでのエラー表示
- [ ] セッション維持（リロード時）
- [ ] ログアウト機能
- [ ] 24時間後の自動ログアウト
- [ ] レスポンシブデザインの確認

### 8. ドキュメント更新

#### 8.1 README.md の更新
- 環境変数の設定方法
- パスワードの変更方法
- セキュリティに関する注意事項

#### 8.2 CLAUDE.md の更新
- 認証機能の概要
- 新しいコンポーネントの説明
- テストコマンドの追加

## 実装順序

1. **Phase 1: 基盤実装**（2-3時間）
   - 環境変数設定
   - auth.ts ユーティリティ
   - Zustand store 拡張

2. **Phase 2: UI実装**（3-4時間）
   - LoginForm コンポーネント
   - PrivateRoute コンポーネント
   - TopBar のログアウトボタン

3. **Phase 3: 統合とテスト**（2-3時間）
   - App.tsx のルーティング設定
   - 動作確認
   - バグ修正

4. **Phase 4: 仕上げ**（1-2時間）
   - スタイリング調整
   - ドキュメント更新
   - 最終テスト

## 注意事項

1. **セキュリティ**
   - パスワードは環境変数で管理
   - セッショントークンは localStorage に保存
   - 本番環境では HTTPS 必須

2. **互換性**
   - 既存の機能に影響を与えない
   - パフォーマンスへの影響を最小限に

3. **ユーザビリティ**
   - シンプルで直感的なUI
   - エラーメッセージは日本語で表示
   - ローディング状態の明示

## 完了基準

- [ ] すべての機能要件を満たしている
- [ ] エラーなくビルドが通る
- [ ] ESLint エラーがない
- [ ] 主要ブラウザで動作確認済み
- [ ] ドキュメントが更新されている