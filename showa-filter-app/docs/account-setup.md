# アカウント作成手順

**作成日**: 2026-02-06

---

## 1. Vercel アカウント作成

**所要時間**: 3分

### 手順

1. **ブラウザで以下のURLを開く**
   ```
   https://vercel.com/signup
   ```

2. **「Continue with GitHub」ボタンをクリック**
   - GitHubアカウントで自動ログイン
   - 認証画面が出たら「Authorize Vercel」をクリック

3. **チーム名を入力（スキップ可能）**
   - 個人利用なら「Skip」でOK

4. **完了！**
   - ダッシュボード画面が表示されたら成功

---

## 2. Supabase アカウント作成

**所要時間**: 5分

### 手順

1. **ブラウザで以下のURLを開く**
   ```
   https://supabase.com/
   ```

2. **右上の「Start your project」ボタンをクリック**

3. **「Continue with GitHub」をクリック**
   - GitHubアカウントで自動ログイン
   - 認証画面が出たら「Authorize Supabase」をクリック

4. **新しいプロジェクトを作成**
   - 「New Project」ボタンをクリック
   
   **入力項目:**
   - **Name**: `showa-filter-app`（任意）
   - **Database Password**: 自動生成されたものを使う（コピーして保存！）
   - **Region**: `Northeast Asia (Tokyo)` を選択
   - **Pricing Plan**: `Free` を選択

5. **「Create new project」ボタンをクリック**
   - プロジェクト作成に1-2分かかる

6. **完了！**
   - ダッシュボードが表示されたら成功
   - **重要**: 左メニューの「Project Settings」→「API」で以下をメモ：
     - `Project URL`
     - `anon public` キー

---

## 3. Stripe アカウント作成

**所要時間**: 5分

### 手順

1. **ブラウザで以下のURLを開く**
   ```
   https://dashboard.stripe.com/register
   ```

2. **メールアドレスとパスワードを入力**
   - または「Sign in with Google」でもOK

3. **メール認証**
   - 登録したメールアドレスに確認メールが届く
   - メール内の「Verify email address」をクリック

4. **ビジネス情報を入力**
   - **Business name**: `昭和フィルター`（仮の名前でOK）
   - **Country**: `Japan`
   - **Industry**: `Software`
   - **Business type**: `Individual / Sole proprietorship`（個人事業主）

5. **テストモードで開始**
   - 最初は「Test mode」で使う（本番環境は後で設定）
   - 画面左上に「TEST MODE」と表示されていればOK

6. **完了！**
   - ダッシュボードが表示されたら成功
   - **重要**: 「Developers」→「API keys」で以下をメモ：
     - `Publishable key` (pk_test_...)
     - `Secret key` (sk_test_...)

---

## 完了チェックリスト

- [ ] Vercel アカウント作成完了
- [ ] Supabase プロジェクト作成完了
  - [ ] Project URL をメモ
  - [ ] anon public キーをメモ
  - [ ] Database Password をメモ
- [ ] Stripe アカウント作成完了
  - [ ] Publishable key をメモ
  - [ ] Secret key をメモ

---

## 注意事項

**APIキー・パスワードは絶対に他人に見せない！**
- これらは後でコードに埋め込むが、GitHubには公開しない設定をする
- `.env.local` ファイルに保存する（後で説明）

---

*最終更新: 2026-02-06*
