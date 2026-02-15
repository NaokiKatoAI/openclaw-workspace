# MEMORY.md - 長期記憶

## 加藤さん
- ECコンサルタント（楽天モール + 自社EC）、エイチームグループ
- マネージャー職（チーム: 松田、岸、吉田）
- 選択肢はA, B, C形式 / プログラミング知識ゼロ → 画面操作レベルで説明
- 認証: Claude Pro/Maxサブスク（setup-token）

## Discordチャンネル運用
- **#キャンプ場予約状況** (1468151119791526114): 浩庵・ふもとっぱら予約監視。報告は埋め込み(Embed)を使わず、普通のテキスト形式で行う。
- **#ほしい物リスト** (1472336978396582094): 投稿→リスト整理＋ピン留め、URL付きは価格追跡→値下げ通知、購入済みチェック

## 定期タスク（cronジョブ）
- **毎日 8:00**: AI・ECニュース → #news / Gmail → #mail-check
- **毎日 9:00**: キャンプ場予約チェック → #キャンプ場予約状況
- **毎日 9:30**: GA4日次レポート（昭和Pictures）
- **毎日 11/14/17/20:00**: Gmail → #mail-check
- **毎日 0:00**: 日次ログ保存 / **12:00**: セッション履歴バックアップ
- **3時間毎**: D2Rアプデチェック → #openclaw-home
- **火・木 12:00**: 筋トレリマインダー（火=上半身A、木=下半身B）
- **土 10:00**: 筋トレA / **日 10:00**: 筋トレB
- **月曜 9:00**: IT・AI補助金情報 → #news
- **毎日 7:00**: OpenClaw/Claude Code/npmアプデチェック
- **日曜 22:00**: 週次ルール最適化
- **毎月23日**: 箱根ガラスの森 請求書リマインダー

## クライアント
- 保存先: `WCA-client/[クライアント名]/`（Notion廃止）
- フロムアイズ（稟議番号9965）、箱根ガラスの森（月額5万、25日請求）、SB C&S（楽天広告DJI等）
- TikTok案件（2026-02-14獲得→ニューレックス）、Bico・GHI、AWC、バルクオム、ハイマート
- 売上定義: 「〇月の売上」= その月稼働分（翌月請求）

## 作成物
- TODOアプリ、ec-consultantスキル、video-creatorスキル
- りんちゃんLP (`rin-lp/`)、りんちゃんRPG (`rin-rpg/` Phase1-2完了)
- YouTube字幕取得 (`scripts/youtube-subtitle.sh`)
- Diablo2R ラダー13 (2/21 9:00開始、加藤さんは夜参戦)
- 昭和映画フィルターアプリ (`showa-filter-app/` 全機能完了、Supabase+Stripe待ち)

## ファイル納品
- ２５MB以下→Discord直接添付、２５MB超→Google Drive
- Drive フォルダID: `1BISfRfSTizEShR-ocLgHVEhF5wuEUblf`
- アップロード: `node scripts/gdrive-upload.js <ファイルパス>`

## OpenClaw運用
- memoryFlush(100k), contextPruning(5m), historyLimit=0
- `sudo pmset disablesleep 1`（再起動で戻る）
- Cron監視LaunchAgent、重要cronは `wakeMode: "now"`
- 加藤さんメッセージに👀で受信確認

---
*最終更新: 2026-02-14*
