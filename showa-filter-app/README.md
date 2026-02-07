# 昭和映画フィルターアプリ

写真を昭和映画風に加工するWebアプリ

## 📋 機能

- 画像アップロード（ドラッグ&ドロップ対応）
- 昭和映画風フィルター
  - 彩度低下
  - 暖色調整（オレンジ寄り）
  - コントラスト調整
  - フィルムグレイン（粒子感）
  - ビネット（周辺減光）
- プレビュー（透かし入り、低解像度）
- ダウンロード（透かしなし、フル解像度）
- リサイズ（Instagram、Twitter、Facebook等）
- 認証（メール/パスワード、Google）
- クレジット制サブスクリプション

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` に以下を設定（既に設定済み）：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zaabpkokgwzxfbobqxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (Webhook設定後に追加)

# Stripe Price IDs（Stripeダッシュボードで作成後に追加）
NEXT_PUBLIC_STRIPE_LIGHT_PRICE_ID=price_... (ライトプラン500円/月)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (プロプラン1,000円/月)
```

### 3. Supabaseのセットアップ

#### 3-1. SQLスキーマの実行

1. Supabaseダッシュボードを開く: https://supabase.com/dashboard
2. プロジェクトを選択
3. 左メニューの「SQL Editor」をクリック
4. `supabase-schema.sql` の内容をコピー&ペースト
5. 「Run」ボタンをクリック

これで以下が作成されます：
- `subscriptions` テーブル
- `download_history` テーブル
- Row Level Security (RLS) ポリシー
- 新規ユーザー自動登録トリガー

#### 3-2. 認証プロバイダーの設定

**Google認証を有効化:**

1. Supabaseダッシュボード → Authentication → Providers
2. 「Google」を選択
3. 「Enabled」をONにする
4. Google Cloud Consoleで OAuth 2.0 クライアントIDを作成
   - https://console.cloud.google.com/
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://zaabpkokgwzxfbobqxz.supabase.co/auth/v1/callback`
5. Client IDとClient SecretをSupabaseに設定
6. 「Save」をクリック

### 4. Stripeのセットアップ

#### 4-1. ProductとPriceの作成

1. Stripeダッシュボードを開く: https://dashboard.stripe.com/
2. 「TEST MODE」になっていることを確認
3. Products → Add product

**ライトプラン:**
- Name: 昭和フィルター - ライト
- Description: 月額500円、30枚/月
- Pricing: Recurring
  - Price: ¥500
  - Billing period: Monthly
- Save

**プロプラン:**
- Name: 昭和フィルター - プロ
- Description: 月額1,000円、無制限
- Pricing: Recurring
  - Price: ¥1,000
  - Billing period: Monthly
- Save

4. 作成したPriceのIDをコピー（`price_...`で始まる）
5. `.env.local` に追加:
   ```env
   NEXT_PUBLIC_STRIPE_LIGHT_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_yyyyy
   ```

#### 4-2. Webhookの設定

1. Stripeダッシュボード → Developers → Webhooks
2. 「Add endpoint」をクリック
3. Endpoint URL: `https://yourdomain.com/api/webhook` (本番環境のURL)
   - ローカル開発時は Stripe CLI を使用
4. Listen to: Select events
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Add endpoint
6. Signing secretをコピー（`whsec_...`で始まる）
7. `.env.local` に追加:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

**ローカル開発時（Stripe CLI使用）:**

```bash
# Stripe CLIをインストール
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhookをローカルにフォワード
stripe listen --forward-to localhost:3000/api/webhook

# 表示されるwebhook signing secretを .env.local に追加
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 📁 プロジェクト構成

```
showa-filter-app/
├── app/
│   ├── page.tsx              # メインページ
│   ├── success/page.tsx      # 購入完了ページ
│   ├── components/
│   │   ├── ImageEditor.tsx   # 画像加工エディタ
│   │   └── AuthModal.tsx     # 認証モーダル
│   ├── api/
│   │   ├── checkout/route.ts # Stripeチェックアウト
│   │   └── webhook/route.ts  # Stripe Webhook
│   └── globals.css           # グローバルスタイル
├── lib/
│   └── supabase.ts           # Supabaseクライアント
├── docs/
│   ├── day1-requirements.md  # 要件定義
│   ├── user-flow.md          # ユーザーフロー
│   ├── screen-list.md        # 画面一覧
│   └── technical-spec.md     # 技術仕様
├── supabase-schema.sql       # DBスキーマ
├── .env.local                # 環境変数
└── README.md                 # このファイル
```

## 🧪 テスト

### Stripe決済のテスト

テストモードで以下のカード番号を使用:

- **成功**: `4242 4242 4242 4242`
- **失敗**: `4000 0000 0000 0002`
- CVC: 任意の3桁
- 有効期限: 未来の日付

## 🚢 デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. Vercelダッシュボード: https://vercel.com/
3. 「Import Project」→ GitHubリポジトリを選択
4. Environment Variablesに `.env.local` の内容を設定
5. Deploy

### デプロイ後の設定

1. VercelのURLを取得（例: `https://your-app.vercel.app`）
2. Supabaseダッシュボード → Authentication → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`
3. Stripe Webhook URL を更新: `https://your-app.vercel.app/api/webhook`

## 📊 プラン

| プラン | 料金 | クレジット |
|--------|------|-----------|
| 無料 | ¥0 | 3枚 |
| ライト | ¥500/月 | 30枚/月 |
| プロ | ¥1,000/月 | 無制限 |

## 🔒 セキュリティ

- プレビューは低解像度（600x450px）+ 透かし入り
- ダウンロード時のみフル解像度 + 透かしなし
- Canvas要素で描画（右クリック保存防止）
- Row Level Security (RLS) でデータ保護
- Stripe決済で安全な課金

## 📝 TODO

- [ ] エラーハンドリング強化
- [ ] ローディング状態の改善
- [ ] モバイル最適化
- [ ] 使い方ガイド
- [ ] 管理画面（売上確認等）

## 👤 開発者

かっぴー

---

*作成日: 2026-02-06*
