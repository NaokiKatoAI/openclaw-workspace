# フロムアイズ公式ECサイト 構造分析レポート

**サイトURL:** https://shopping.refrear.jp/  
**分析日:** 2026年2月3日  
**目的:** 4/1リブランディング対応（ロゴ・パッケージ・テキスト差し替え）

---

## 1. サイト全体の構造

### 1.1 ヘッダー構造
- **固定ヘッダーバナー（最上部）**
  - 背景色: 赤（#e61b1c）
  - 重要なお知らせ表示エリア
  - 現在の内容: クレジットカード登録に関する注意喚起
  - PC版: `top:0` / SP版: `top:0`

- **メインヘッダー**
  - PC版画像: `header-logo.png`
  - SP版画像: `header-logo_sp.png`
  - ロゴリンク先: トップページ
  - 配置: `<h1 class="header__title">` 内
  - 検索ボックス（キーワード検索機能）

### 1.2 ナビゲーション構造
**ヘッダーメニュー項目:**
- 1DAY（`header-item.svg`）
- 2WEEK（`header-item2.svg`）
- 1MONTH（`header-item3.svg`）
- 定期購入（`header-item4.svg`）
- ログイン（`header-item5.svg`）
- カート（`header-item6.svg`）

**ハンバーガーメニュー（ドロワー）:**
- 使用期間で選ぶ
  - 1DAY（`drawer-item.png`）
  - 2WEEK（`drawer-item2.png`）
  - 1MONTH（`drawer-item3.png`）
  - 定期購入（`drawer-item4.png`）
  
- レンズのタイプで選ぶ
  - スタンダード（`drawer2-item.png`）
  - プレミアム（`drawer2-item2.png`）
  - ブルーライトカット（`drawer2-item3.png`）
  - カラーコンタクトレンズ（`drawer2-item4.png`）

- サブメニュー
  - ご利用ガイド（`drawer-guid.png`）
  - よくある質問（`drawer-faq.png`）

### 1.3 フッター構造
**SNSリンク:**
- Facebook（`icon-facebook.png`）
- Twitter（`icon-twitter.png`）
- Instagram（`icon-insta.png`）
- LINE（`icon-line.png`）

**バナーリンク（画像）:**
- リフレア公式LINEアカウント（`refrear_footer_01_2503_03.jpg`）
- レビュー投稿キャンペーン（`refrear_footer_02.jpg`）
- ブランドサイト（`refrear_footer_03.jpg`）
- 眼科一覧（`refrear_footer_04.jpg`）
- お問い合わせ（`refrear_footer_05.jpg` - 電話番号: 0120-224-552）
- お問い合わせフォーム（`refrear_footer_06.jpg`）
- よくある質問（`refrear_footer_07.jpg`）
- ご利用ガイド（`refrear_footer_08.jpg`）

**テキストリンクメニュー:**
- オンライン会員特典
- コンタクトレンズ関連用語集
- コンタクトレンズの使い方
- 特定商取引法に基づく表記
- 利用規約
- 個人情報の取扱いについて
- プライバシーポリシー
- 会社情報
- 製品・商標に関する注記
- ブランドサイト

**コピーライト:**
```
©2015 from-eyes Co.,Ltd All Rights Reserved.
```

---

## 2. 商品カテゴリーと分類

### 2.1 使用期間による分類
- **1DAY** - `/category-1day/`
- **2WEEK** - `/category-2week/`
- **1MONTH** - `/category-1month/`
- **定期購入** - `/category-teiki/`

### 2.2 レンズタイプによる分類
- **STANDARD（スタンダード）** - `/standard/`
  - コスパ重視・快適品質
  - キャッチコピー: 「あなたのめに映る世界を、やさしいものに」
  
- **PREMIUM（プレミアム）** - `/premium/`
  - シリコーンタイプ
  - キャッチコピー: 「あなたの瞳にもっと寄り添うシリコーンタイプ」
  
- **BLUE LIGHT（ブルーライトカット）** - `/blue-light/`
  - PC・スマホ対策
  - キャッチコピー: 「紫外線だけでなく、PC・スマホのブルーライトからも守ります」
  
- **COLOR（カラーコンタクトレンズ）** - `/color/`

### 2.3 主要商品シリーズ
1. **ワンデーリフレアUVモイスチャー38**
   - 商品画像: `standard1-title.png`
   - パッケージ画像: 商品詳細ページに表示
   
2. **ツーウィークリフレアUV**
   - 商品画像: `standard2-title.png`

3. **カラコンシリーズ:**
   - **Suclair（シュクレール）** - 1MONTH
     - イメージモデル: 古澤里紗さん、増田彩乃さん
     - バナー: `PC.png` / `SP.png`
   
   - **Unrolla（アンローラ）** - 1DAY
     - イメージモデル: 坂巻 有紗さん
     - バナー: `PC_Unrolla_2509.png`
   
   - **a-eye（エーアイ）** - 1DAY
     - イメージモデル: BABYMONSTER
     - バナー: `a-eye_202510_TOP_PC.jpg`
     - キャンペーン用バナー: `a-eye_akusuta_970_344.jpg`

---

## 3. トップページの構成要素

### 3.1 メインビジュアル（スライダー）
Swiperライブラリを使用した自動再生スライダー
- **スライド1:** 定期便トライアルキャンペーン（`ec_top_trial_pc.png`）
- **スライド2:** STANDARD（`new_ec_top_standard_pc.jpg`）
- **スライド3:** PREMIUM（`ec_top_premium_pc.jpg`）
- **スライド4:** BLUE LIGHT（`ec_top_bluelight_pc.jpg`）
- **スライド5:** Suclair（シュクレール）
- **スライド6:** Unrolla（アンローラ）
- **スライド7:** a-eye（エーアイ）

**設定:**
- 自動再生: 5秒間隔
- ループ再生
- ページネーション・ナビゲーションボタン付き
- レスポンシブ対応（PC/SP画像切り替え）

### 3.2 トップバナーセクション
- **送料無料バナー:** `シンプル1.png`（ネコポスご利用）
- **当日発送バナー:** `シンプル2.png`（平日15時まで）
- **累計出荷数バナー:** `top_cumulative_banner_202501_v2.jpg`（2億8千万枚突破）

### 3.3 商品選択セクション
**使用期間で選ぶ:**
- `term-title.png` - セクションタイトル
- `term-item.png` / `term-item2.png` / `term-item3.png` / `term-item4.png` - 各カテゴリー画像

**シリーズで選ぶ:**
- `series-title.png` - セクションタイトル
- `series-item.png` / `series-item2.png` / `series-item3.png` / `series-item4.png` - 各シリーズ画像

### 3.4 商品詳細セクション
各シリーズ（STANDARD/PREMIUM/BLUE LIGHT）ごとに：
- シリーズタイトル画像（例: `standard-title.png`）
- 商品別タイトル画像（例: `standard1-title.png`）
- 購入ボタン画像（30枚入×1箱、×2箱、×4箱など）

### 3.5 カラコンバナー
- 商品画像: `color-contacts_202408.png`
- リンク先: `/color/`

### 3.6 お知らせセクション
- 最新5件のお知らせを表示
- 日付とタイトルリンク
- 「ニュース一覧」リンク

### 3.7 フローティングバナー
- お試し定期便バナー（`banner-item-trial.png`）
- 閉じるボタン（`banner-close.png`）
- JavaScript制御で表示/非表示

---

## 4. 商品ページの構成要素

**URL例:** `/standard-1day-30x1box/`

### 4.1 商品情報エリア
- **商品名:** ワンデーリフレアUVモイスチャー38 30枚入×1箱
- **商品画像:** メインビジュアル（パッケージ写真）
- **レビュー評価:** 星評価とレビューリンク
- **価格表示:** ￥1,406
- **選択フォーム:**
  - 左目の度数選択
  - 左目の数量
  - 右目の度数選択
  - 右目の数量
- **購入ボタン:** 「買い物かごに入れる」

### 4.2 商品特徴セクション
- MPCポリマー配合（保湿性）
- UVカット機能
- 低含水レンズの特徴

### 4.3 製品スペック表
- 製品名（英語・日本語）
- 入数
- 使用日数
- BC（ベースカーブ）
- レンズ度数範囲
- DIA（レンズ直径）
- Dk値（酸素透過係数）
- UVカット率
- 医療機器承認番号
- 添付文書PDFダウンロードリンク

### 4.4 品質保証セクション
- 国際規格準拠の製造
- 国内倉庫管理システム

### 4.5 FAQ（よくある質問）
- 支払い方法
- 電話注文の可否
- 配送時期
- 配送方法と送料
- 後払い請求書について
- キャンセル・返品・交換
- 特殊レンズの取り扱い

### 4.6 配送情報
- ネコポス送料無料
- スリムコンパクト梱包
- 配送日時指定不可（ポスト投函）

### 4.7 注意事項
- クーポンコード使用方法
- コンタクトレンズの安全使用に関する注意喚起
- 医療機器としての取扱い

---

## 5. 注目すべきデザイン要素・機能

### 5.1 レスポンシブデザイン
- PC版とSP版で異なる画像・レイアウト
- 画像パス例:
  - PC: `slider/ec_top_standard_pc.jpg`
  - SP: `slidersp/ec_top_standard_sp.jpg`

### 5.2 画像中心のデザイン
- テキストは最小限
- ボタン、タイトル、バナーはほぼすべて画像化
- alt属性に説明文あり

### 5.3 使用画像形式
- PNG（透過背景のアイコン・ボタン）
- JPG（写真・バナー）
- WebP（一部最適化画像）
- SVG（ヘッダーアイコン）

### 5.4 インタラクティブ要素
- Swiperスライダー（自動再生）
- ハンバーガーメニュー（ドロワー）
- アコーディオンメニュー
- フローティングバナー
- ページトップへ戻るボタン（`icon_pagetop.svg`）

### 5.5 外部サービス連携
- Google Tag Manager（計測）
- Amazon Pay決済
- スコア後払い
- Hapitas（アフィリエイト）
- Facebook Domain Verification
- 郵便番号自動入力（yubinbango.js）

### 5.6 アニメーション・演出
- CSS3 Animate It（要素の表示アニメーション）
- Slick Carousel（スライダー）
- TweenMax / TimelineMax（アニメーション）
- SweetAlert（ポップアップ）

---

## 6. リブランディングで差し替えが必要な箇所

### 🔴 最重要（ロゴ・ブランド表示）

#### ヘッダーロゴ
- [ ] `header-logo.png` - PCヘッダーロゴ
- [ ] `header-logo_sp.png` - SPヘッダーロゴ
- [ ] `favicon.ico` - ファビコン
- [ ] `cropped-favicon_512_512-*.png` - 各種サイズファビコン

#### フッター
- [ ] コピーライト表記: `©2015 from-eyes Co.,Ltd All Rights Reserved.`
- [ ] 会社情報ページ内のテキスト

### 🟠 重要（商品パッケージ・画像）

#### 商品パッケージ画像
各商品詳細ページのメインビジュアル（実際の商品パッケージ写真）
- [ ] ワンデーリフレアUVモイスチャー38
- [ ] ツーウィークリフレアUV
- [ ] 1MONTHシリーズ
- [ ] その他全商品

#### 商品タイトル画像
- [ ] `standard1-title.png` - ワンデーリフレアUVモイスチャー38
- [ ] `standard2-title.png` - ツーウィークリフレアUV
- [ ] その他商品タイトル画像（全商品分）

#### 購入ボタン画像
- [ ] `standard1-item1-off.webp` - 30枚入×2箱
- [ ] `standard1-item2.png` - 30枚入×1箱
- [ ] `standard1-item3-off.webp` - 30枚入×4箱
- [ ] その他購入ボタン（全パターン）

### 🟡 中程度（セクション・カテゴリー表示）

#### スライダー画像
- [ ] `ec_top_trial_pc.png` / `ec_top_trial_sp.png` - トライアル
- [ ] `new_ec_top_standard_pc.jpg` / `new_ec_top_standard_sp.jpg` - STANDARD
- [ ] `ec_top_premium_pc.jpg` / `ec_top_premium_sp.jpg` - PREMIUM
- [ ] `ec_top_bluelight_pc.jpg` / `ec_top_bluelight_sp.jpg` - BLUE LIGHT

#### セクションタイトル
- [ ] `term-title.png` - 使用期間で選ぶ
- [ ] `series-title.png` - シリーズで選ぶ
- [ ] `standard-title.png` - スタンダードセクション
- [ ] `drawer-title.png` - ドロワーメニュー「使用期間で選ぶ」
- [ ] `drawer2-title.png` - ドロワーメニュー「レンズのタイプで選ぶ」

#### カテゴリーアイコン（ヘッダー）
- [ ] `header-item.svg` - 1DAY
- [ ] `header-item2.svg` - 2WEEK
- [ ] `header-item3.svg` - 1MONTH
- [ ] `header-item4.svg` - 定期購入

#### カテゴリー画像（本文）
- [ ] `term-item.png` / `term-item2.png` / `term-item3.png` / `term-item4.png` - 使用期間
- [ ] `series-item.png` / `series-item2.png` / `series-item3.png` / `series-item4.png` - シリーズ

#### ドロワーメニュー画像
- [ ] `drawer-item.png` / `drawer-item2.png` / `drawer-item3.png` / `drawer-item4.png` - 使用期間
- [ ] `drawer2-item.png` / `drawer2-item2.png` / `drawer2-item3.png` / `drawer2-item4.png` - レンズタイプ

### 🟢 低（その他バナー・装飾）

#### バナー画像
- [ ] `シンプル1.png` - 送料無料
- [ ] `シンプル2.png` - 当日発送
- [ ] `top_cumulative_banner_202501_v2.jpg` - 累計出荷数
- [ ] `color-contacts_202408.png` - カラコン一覧
- [ ] `blue-button.png` / `blue-button_sp.png` - ブルーライト詳細へ
- [ ] `banner-item-trial.png` - フローティングバナー

#### フッターバナー
- [ ] `refrear_footer_01_2503_03.jpg` - LINE公式アカウント
- [ ] `refrear_footer_02.jpg` - レビュー投稿
- [ ] `refrear_footer_03.jpg` - ブランドサイト
- [ ] `refrear_footer_04.jpg` - 眼科一覧
- [ ] `refrear_footer_05.jpg` - 電話番号
- [ ] `refrear_footer_06.jpg` - お問い合わせ
- [ ] `refrear_footer_07.jpg` - よくある質問
- [ ] `refrear_footer_08.jpg` - ご利用ガイド

#### その他UI要素
- [ ] `drawer-guid.png` / `drawer-faq.png` - ドロワーメニューサブ項目
- [ ] `drawer-login.png` - ログインボタン
- [ ] `banner-close.png` - バナー閉じるボタン
- [ ] `icon_pagetop.svg` - ページトップへ戻る

### 📝 テキスト差し替え（HTML/CSS内）

#### メタ情報
- [ ] `<title>` タグ内のサイト名
- [ ] `<meta name="description">` 内のブランド名
- [ ] OGP設定（`og:title`, `og:description`, `og:site_name`）
- [ ] Schema.org構造化データ内のブランド名

#### altテキスト
- [ ] すべての画像の alt 属性内のブランド名・商品名
- [ ] 例: `alt="コスパの良いコンタクトレンズ通販ならRefrear ONLINE SHOP"`

#### PDF・ドキュメント
- [ ] 添付文書PDFファイル（`refrear_UV38.pdf`など）
- [ ] 各商品の添付文書内のブランド名・ロゴ

#### JavaScript・動的コンテンツ
- [ ] カート連携システム内の商品名表示
- [ ] 検索結果ページの商品名
- [ ] お知らせ・ニュース記事内のブランド名

---

## 7. 技術的注意点

### 7.1 画像パス構造
```
/shopping-refrair/wp-content/themes/kaihatu/
├── images/
│   ├── header-logo.png
│   ├── header-item*.svg
│   ├── slider/（PC版スライダー画像）
│   ├── common/slidersp/（SP版スライダー画像）
│   ├── drawer-*.png
│   ├── term-*.png
│   ├── series-*.png
│   ├── standard*.png
│   └── その他UI画像
└── /shopping-refrair/wp-content/uploads/（アップロード画像）
    ├── 2024/
    ├── 2025/
    └── 年月別フォルダ
```

### 7.2 使用フォント
- Noto Serif JP（400, 600）
- Noto Sans JP（100-900）
- Shippori Mincho（700）

### 7.3 レスポンシブブレークポイント
- PC: 769px以上
- SP: 768px以下

### 7.4 使用ライブラリ
- WordPress（CMS）
- jQuery
- Swiper.js（スライダー）
- Slick Carousel
- Bootstrap Grid
- CSS3 Animate It
- SweetAlert（ポップアップ）
- Lity（ライトボックス）

---

## 8. 差し替え作業の推奨順序

1. **ロゴ・ファビコン** - 最優先（サイト全体のブランディング）
2. **商品パッケージ画像** - 各商品詳細ページ
3. **スライダー画像** - トップページの目玉コンテンツ
4. **セクションタイトル画像** - 各カテゴリー見出し
5. **ボタン・アイコン画像** - ナビゲーション・UI要素
6. **バナー画像** - キャンペーン・告知バナー
7. **テキスト差し替え** - HTML/CSS/JavaScript内
8. **PDF・ドキュメント** - 添付文書類
9. **メタ情報・SEO** - title/description等
10. **最終チェック** - 全ページ目視確認

---

## 9. チェックリスト対象ページ

### 必須確認ページ
- [ ] トップページ（`/`）
- [ ] 1DAYカテゴリー（`/category-1day/`）
- [ ] 2WEEKカテゴリー（`/category-2week/`）
- [ ] 1MONTHカテゴリー（`/category-1month/`）
- [ ] 定期購入（`/category-teiki/`）
- [ ] スタンダード（`/standard/`）
- [ ] プレミアム（`/premium/`）
- [ ] ブルーライト（`/blue-light/`）
- [ ] カラーコンタクト（`/color/`）
- [ ] 各商品詳細ページ（全商品）
- [ ] カートページ
- [ ] マイページ
- [ ] ご利用ガイド（`/guide/`）
- [ ] よくある質問（`/faq/`）
- [ ] お知らせ一覧（`/category/news/`）
- [ ] 会社情報（`/company/`）

---

## 10. 補足・備考

### サイトの特徴
- **画像中心のデザイン:** テキストが少なく、ほぼすべての要素が画像化されているため、差し替え作業は膨大になる可能性あり
- **レスポンシブ対応:** PC/SP別画像を用意しているため、1箇所につき2ファイルの差し替えが必要
- **WordPress使用:** テーマファイルとアップロードフォルダの両方を確認する必要あり
- **画像形式混在:** PNG/JPG/WebP/SVG が混在しているため、形式を合わせる必要あり

### 注意点
- 商品パッケージ写真は実物を撮影し直す必要がある
- altテキストも忘れずに更新（SEO・アクセシビリティ対策）
- キャッシュクリアを忘れずに（CDN・ブラウザキャッシュ）
- 旧ロゴが埋め込まれた画像（スクリーンショット等）も確認
- PDFファイル内のロゴも差し替え対象

### 作業効率化のヒント
- 画像ファイル名のパターンを把握してスクリプトで一括検索
- WordPressメディアライブラリで「refrear」「リフレア」などで検索
- テーマファイル全体をgrep検索でブランド名を抽出
- ステージング環境で差し替え後の表示確認を徹底

---

**以上、フロムアイズ公式ECサイトの構造分析レポートでした。**  
**リブランディング作業の際は、このレポートをチェックリストとして活用してください。**
