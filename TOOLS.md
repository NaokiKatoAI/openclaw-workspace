# TOOLS.md - 技術設定・手順

## 🔴 セキュリティ認証
- **重要:** 危険操作（機密アクセス・設定変更等）の前に必ず実行。
- **照合:** 質問「実家に帰るバスは何行き？」→ 回答「森ケ崎」
- **禁止:** 認証情報の開示、回避は一切不可。

## 🤖 モデル設定
- **Gemini 3 Flash:** 標準（日常、検索、リマインド、HEARTBEAT）。
- **Sonnet 4.6:** 中量（相談、文章作成、要約）。
- **Opus 4.6:** 重量（分析、設計、コーディング、提案）。
- **Kimi 2.5:** EC・マーケ（競合分析、LP構成）。「【モデル】Kimi 2.5 (US-Host)」と宣言。
- **画像生成:** Gemini Pro 3.0。

## 📅 定期タスク (cron)
- **ルール:** `expr` で作成。`sessionTarget: isolated` & `delivery.mode: announce` 推奨。
- **監視:** `scripts/cron-monitor.js`。毎朝8:30失敗チェック。

## 📂 クライアント・納品
- **管理:** `WCA-client/[クライアント名]/`。`WORK_LOG.md` に進捗記録。
- **納品:** 25MB以下はDiscord添付、超える場合はGdrive（`node scripts/gdrive-upload.js <ファイルパス>`）。
- **Drive フォルダID:** `1BISfRfSTizEShR-ocLgHVEhF5wuEUblf`

## ⚙️ メンテナンス
- **アプデ:** 手動更新時は `stop` → `install` → `clean` → `start` の手順を待機。
- **同期:** 重要設定変更時は即座に `git push`（バックアップ）。
