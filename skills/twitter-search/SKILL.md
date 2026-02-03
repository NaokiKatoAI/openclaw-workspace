---
name: twitter-search
description: Search Twitter/X posts using Twitter API v2. Use when user wants to search for tweets, find trending topics, monitor keywords, check competitor activity, or analyze social media content. Supports keyword search with automatic rate limiting (Basic plan 10,000 posts/month).
---

# Twitter Search

X（Twitter）のポストを検索するスキル。API v2を使用し、キーワード検索・トレンド調査・競合分析などに対応。

## 使い方

```bash
node scripts/search.js "検索キーワード" [最大件数]
```

**例:**
```bash
# ECに関するポストを検索
node scripts/search.js "EC 売上アップ" 10

# 競合をチェック
node scripts/search.js "from:competitor_account" 20

# ハッシュタグ検索
node scripts/search.js "#楽天市場" 15
```

## 検索オプション

Twitter API v2の検索演算子をサポート:

- `キーワード` - 単純なキーワード検索
- `"完全一致"` - フレーズ検索
- `from:username` - 特定ユーザーのポスト
- `#hashtag` - ハッシュタグ検索
- `-除外ワード` - 除外検索
- `keyword1 OR keyword2` - OR検索
- `keyword1 keyword2` - AND検索（デフォルト）

## 制限・注意事項

**✅ 無料:** 月10,000ポストまで（Basic plan）

**⚠️ 自動制限:**
- 9,500ポスト到達 → 警告表示
- 10,000ポスト到達 → API停止（翌月1日に自動リセット）

**📊 使用状況:**
実行のたびに現在の使用量が表示される。

## 出力形式

各ポストについて以下を表示:
- ユーザー名・表示名
- ポスト本文
- エンゲージメント（いいね・RT・返信数）
- ポストURL
- 投稿日時

## 設定ファイル

- `~/.openclaw/twitter-secrets.json` - APIキー（自動作成済み）
- `~/.openclaw/twitter-counter.json` - 使用量カウンター（自動管理）

## 参考資料

詳細な検索クエリの書き方は `references/query-syntax.md` を参照。
