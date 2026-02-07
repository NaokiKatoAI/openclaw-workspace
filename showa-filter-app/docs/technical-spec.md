# 技術仕様

**作成日**: 2026-02-06

---

## フィルター仕様（昭和映画風）

### 処理内容
1. **彩度低下**
   - 元画像の彩度を30-50%減少

2. **黄色/オレンジ色調**
   - カラーバランス調整
   - 暖色系（Warm tone）に寄せる

3. **コントラスト調整**
   - 軽くコントラストを上げる（10-20%）
   - ハイライト・シャドウを微調整

4. **フィルムグレイン（粒子感）**
   - ノイズを追加（粒子サイズ・密度調整）
   - ランダム配置で自然な質感

5. **ビネット（周辺減光）**
   - 画像の四隅を暗くする
   - 中心から外側に向かってグラデーション

---

## 使用技術・ライブラリ

### フロントエンド
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS** (レトロ風デザイン)
- **Canvas API** (画像処理)
  - または **fabric.js** / **Konva.js** (高度な処理が必要な場合)

### 認証・DB
- **Supabase**
  - Authentication（メール/ソーシャルログイン）
  - Database（PostgreSQL）
    - ユーザー情報
    - クレジット残数
    - 購入履歴

### 決済
- **Stripe**
  - Checkout Session（サブスクリプション）
  - Webhook（購入完了・キャンセル処理）

### ホスティング
- **Vercel**
  - Next.js最適化
  - 自動デプロイ（GitHub連携）

---

## データベース設計（Supabase）

### users テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー（Supabase Auth連携） |
| email | text | メールアドレス |
| created_at | timestamp | 登録日時 |

### subscriptions テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | uuid | 外部キー（users） |
| plan | text | プラン名（free/light/pro） |
| credits | int | クレジット残数 |
| stripe_subscription_id | text | Stripe契約ID |
| status | text | ステータス（active/canceled） |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### download_history テーブル（オプション）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | uuid | 外部キー（users） |
| downloaded_at | timestamp | ダウンロード日時 |

---

## Stripe プラン設定

### 無料プラン
- 料金: 0円
- クレジット: 3枚（買い切り、リセットなし）
- Stripe登録不要（DB上のみで管理）

### ライトプラン
- 料金: 500円/月
- クレジット: 30枚/月（毎月1日リセット）
- Stripe Product ID: `price_light_500`

### プロプラン
- 料金: 1,000円/月
- クレジット: 無制限
- Stripe Product ID: `price_pro_1000`

---

## 画像処理フロー（Canvas API）

```javascript
// 擬似コード
function applyShowaFilter(image, size) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 1. リサイズ
  canvas.width = size.width;
  canvas.height = size.height;
  ctx.drawImage(image, 0, 0, size.width, size.height);
  
  // 2. 彩度低下 + 暖色調整
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // RGB値を取得
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // 彩度低下（グレースケール化 + 元の色をブレンド）
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = r * 0.6 + gray * 0.4;
    g = g * 0.6 + gray * 0.4;
    b = b * 0.6 + gray * 0.4;
    
    // 暖色調整（オレンジ寄り）
    r = Math.min(255, r * 1.1);
    g = Math.min(255, g * 1.05);
    b = Math.min(255, b * 0.9);
    
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // 3. コントラスト調整
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 4. フィルムグレイン
  addFilmGrain(ctx, canvas.width, canvas.height);
  
  // 5. ビネット
  addVignette(ctx, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.9);
}
```

---

*最終更新: 2026-02-06*
