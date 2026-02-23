# MEMORY.md - 長期記憶

## 家族・ペット
- **りんちゃん（犬）**: 2021年8月2日生まれ、今年5歳。毎日散歩が日課。

## 加藤さん
- ECコンサルタント（楽天モール + 自社EC）、WCA社員
- マネージャー職（チーム: 松田、岸、吉田）
- 価値基準はコスト最優先（時間=コスト）。無意味な作業・未使用機能への投資を嫌う。

## 機密ルール
- クライアント情報は **#openclaw-home のみ横断参照OK**
- #openclaw-home 以外のチャンネルへのクライアント情報の持ち出し**絶対禁止**
- クライアント情報をAIに学習させることも**禁止**

## Discordチャンネル運用
- **#キャンプ場予約状況** (1468151119791526114): 浩庵・ふもとっぱら・TENKU BASE予約監視。報告は埋め込み(Embed)を使わず、普通のテキスト形式で行う。空室のみ報告。
  - **抽出条件**: 基本は土曜のみ。3連休（祝日で土日月が連休）の週末のみ土日を報告。GW/夏季休暇/年末年始などの大型連休のみ全日取得。平日・日曜単体・祝日単体は除外。
  - **TENKU BASE固有**: MサイズUP（ラM/ラL/フM/新ラ/天L/新天L/新天L極）のみ報告。S以下・✕情報は非表示。予約フォーム: https://docs.google.com/forms/d/e/1FAIpQLSdBIcoPt3q09247hYpemaYdPdzm-86SsP_ytbQLD7EhxU7isA/viewform
- **#ほしい物リスト** (1472336978396582094): 投稿→リスト整理＋ピン留め、URL付きは価格追跡→値下げ通知、購入済みチェック
- **#am3** (1473692082030772256): WCA EC専門チーム（松田、吉田、岸）。原則Sonnet 4.6を使用。

## 定期タスク（cronジョブ）
- **クライアント関連リマインドは祝日・土日を避ける**: 実行日が土日または日本の祝日の場合、翌営業日（平日）9:00に1回限りcronを作成して通知を延期する。
- **毎日 8:00**: AI・ECニュース → #news / Gmail → #mail-check
  - **ルール**: 「該当なし」のセクションは記載しない（情報があるセクションのみ掲載）
- **毎日 9:00**: キャンプ場予約チェック → #キャンプ場予約状況
- **毎日 9:30**: GA4日次レポート（昭和Pictures）
- **毎日 11/14/17/20:00**: Gmail → #mail-check
- **毎日 0:00**: 日次ログ保存 / **12:00**: セッション履歴バックアップ
- **毎日 7:00**: OpenClaw/Claude Code/npmアプデチェック
- **毎日 7:00**: 週次ルール最適化チェック
- **毎月23日**: 箱根ガラスの森 請求書リマインダー

## クライアント
- 保存先: `WCA-client/[クライアント名]/`
- フロムアイズ（ECコンサル案件の稟議番号9965）、箱根ガラスの森（月額5万、25日請求）、SB C&S（楽天広告DJI等）
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

## Discord ライフサイクルリアクション（2026-02-22設定済み）
- 絵文字順: 👀→⏳→🤔→🔥→👍(24h常駐)。config.patchで管理。
- **⚠️ OpenClawアップデート後に要config.patch再適用**（ackReaction/statusReactions.enabled/ackReactionScope:all/removeAckAfterReply/doneHoldMs:86400000）

## モデル選定方針
- **OAuth（サブスク）を最優先する理由**: 現在の使用量でAPIキー（従量課金）にすると月$200超え確実。定額サブスクが圧倒的にお得。

## APIキー
- **Brave Search API**: `BSAMVyrNQjzSxxDUNH54lhj_WRDnIIw` — 切れたら `tools.web.search.apiKey` に再設定（`config.patch`）

## 文脈誤読パターン（要注意）
- 加藤さんが自分の誤字を訂正した際（例：「細く→補足」）、私のミスと混同して謝罪してしまった（2026-02-22）。短い補正メッセージは「誰が何を直しているか」を確認してから反応すること。

## OpenClaw運用
- memoryFlush(100k), contextPruning(5m), historyLimit=0
- 重要cronは `wakeMode: "now"`
- Discord向けcronの `delivery.to` は必ず `channel:<id>` / `user:<id>` 形式（数字のみは配信失敗リスク）
- **⚠️ cronのdelivery設定ミス多発**: `channel`は`"discord"`固定、送信先は必ず`to`に書く。正: `{"channel":"discord","to":"channel:1234..."}`
- `openclaw cron list` は gateway timeout で失敗する場合あり。代替: `~/.openclaw/cron/jobs.json` を直接参照
- 「全体反映」= ルール更新（AGENTS/TOOLS/SOUL/USER/HEARTBEATの必要箇所）→ 全アクティブセッションに `/new` 配布 → MEMORY/日次ログへ記録
- gateway.mode は `local` を維持

## 障害復旧メモ（2026-02-20）
- 復旧ワンセット（Discord無反応・config消失時）:
  1. `cp ~/.openclaw/openclaw.json.bak.working-0220 ~/.openclaw/openclaw.json`
  2. `openclaw gateway stop`
  3. `rm -f ~/.openclaw/agents/main/sessions/sessions.json`
  4. `rm -f ~/.openclaw/agents/main/delivery-recovery.json`
  5. `openclaw gateway install --force`
  6. `openclaw gateway start`

---
*最終更新: 2026-02-23（コスト最適化・冗長削除）*
