# 🚀 セットアップガイド（朝起きたらやること）

**作成日**: 2026-02-07 早朝

---

## ✅ 完成している機能

### 1. 基本UI
- レフトナビ + メインコンテンツ
- ホーム、エディタ、プラン、アカウント画面
- 昭和レトロ風デザイン

### 2. 画像処理
- 画像アップロード（ドラッグ&ドロップ）
- 昭和映画フィルター（Canvas API）
- プレビュー（透かし入り、低解像度 600x450px）
- ダウンロード（透かしなし、フル解像度）
- リサイズ（Instagram、Twitter、Facebook等）

### 3. 認証
- メール/パスワード認証
- Googleログイン対応
- 自動サインアップ

### 4. クレジット管理
- 無料: 3枚
- ライト: 30枚/月
- プロ: 無制限
- ダウンロード時に自動消費

### 5. Stripe決済
- チェックアウトAPI実装済み
- Webhook実装済み
- 購入完了ページ実装済み

---

## 🔧 やること（朝起きたら）

### Step 1: Supabaseのセットアップ（5分）

1. **Supabaseダッシュボードを開く**
   ```
   https://supabase.com/dashboard
   ```

2. **プロジェクトを選択**
   - `NaokiKatoAI's Project` をクリック

3. **SQLエディタを開く**
   - 左メニュー → 「SQL Editor」

4. **スキーマを実行**
   - `supabase-schema.sql` の内容を全てコピー
   - SQLエディタにペースト
   - 「Run」ボタンをクリック
   - 成功メッセージが表示されればOK

5. **Google認証を有効化（オプション）**
   - 左メニュー → Authentication → Providers
   - 「Google」を選択 → 「Enabled」をON
   - Client ID/Secretは後で設定（まず動作確認優先）

---

### Step 2: Stripeのセットアップ（10分）

#### 2-1. ProductとPriceの作成

1. **Stripeダッシュボードを開く**
   ```
   https://dashboard.stripe.com/
   ```

2. **TEST MODEになっていることを確認**
   - 画面左上に「TEST MODE」と表示されている

3. **ライトプランを作成**
   - Products → 「Add product」
   - Name: `昭和フィルター - ライト`
   - Description: `月額500円、30枚/月`
   - Pricing model: `Recurring`
   - Price: `¥500`
   - Billing period: `Monthly`
   - 「Save product」

4. **プロプランを作成**
   - Products → 「Add product」
   - Name: `昭和フィルター - プロ`
   - Description: `月額1,000円、無制限`
   - Pricing model: `Recurring`
   - Price: `¥1,000`
   - Billing period: `Monthly`
   - 「Save product」

5. **Price IDをコピー**
   - 各プランの「Pricing」セクションに表示される `price_xxxxx` をコピー

#### 2-2. 環境変数に追加

`.env.local` を開いて、以下を追加：

```env
# Stripe Price IDs
NEXT_PUBLIC_STRIPE_LIGHT_PRICE_ID=price_xxxxx（ライトプランのID）
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_yyyyy（プロプランのID）
```

---

### Step 3: 動作確認（10分）

#### 3-1. 開発サーバーを再起動

```bash
# 一旦停止（Ctrl+C）
# 再起動
cd showa-filter-app
npm run dev
```

#### 3-2. ブラウザで開く

```
http://localhost:3000
```

#### 3-3. テストフロー

**A. 新規登録**
1. 自動的に認証モーダルが表示される
2. メールアドレスとパスワードを入力
3. 「登録する」をクリック
4. メールを確認（確認リンクをクリック）
5. 再度ログイン

**B. 画像加工**
1. 左ナビ「使ってみる」をクリック
2. 画像をアップロード（ドラッグ&ドロップ or クリック）
3. 「フィルター適用」をクリック
   - プレビューが表示される（透かし入り）
4. 「ダウンロード」をクリック
   - クレジットが1枚減る
   - 透かしなしの高品質画像がダウンロードされる

**C. プラン購入（テスト）**
1. 左ナビ「プラン」をクリック
2. 「ライト」プランの「選択する」をクリック
3. Stripeチェックアウトページに遷移
4. テストカード番号を入力：`4242 4242 4242 4242`
   - CVC: `123`
   - 有効期限: 未来の日付（例: `12/34`）
   - 名前: 適当
5. 「Subscribe」をクリック
6. 購入完了ページに遷移
7. ホームに戻る
8. クレジットが30枚になっているか確認

---

### Step 4: Webhook設定（オプション・後回しOK）

**本番環境（Vercelデプロイ後）に必要**

ローカル開発時はStripe CLIを使う：

```bash
# Stripe CLIをインストール（初回のみ）
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhookをローカルにフォワード
stripe listen --forward-to localhost:3000/api/webhook

# 表示されるwebhook signing secretをコピーして .env.local に追加
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 🐛 トラブルシューティング

### 問題: ログインできない
- Supabaseでスキーマを実行したか確認
- メール確認リンクをクリックしたか確認
- ブラウザのコンソールでエラーを確認

### 問題: Stripe決済が動かない
- TEST MODEになっているか確認
- Price IDを `.env.local` に追加したか確認
- 開発サーバーを再起動したか確認

### 問題: 画像処理がおかしい
- ブラウザのコンソールでエラーを確認
- 対応形式（JPEG/PNG/WebP）か確認

---

## 📝 次にやること（余裕があれば）

- [ ] Google認証の完全設定
- [ ] エラーハンドリング強化
- [ ] モバイルUI調整
- [ ] Vercelへデプロイ
- [ ] 本番環境のWebhook設定

---

## 🎉 完成！

朝起きたら、上記のStep 1〜3を順番にやれば動く。

何か問題があれば、このファイルとREADME.mdを見返せ。

おやすみだ。
