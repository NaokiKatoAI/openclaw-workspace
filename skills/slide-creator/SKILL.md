# Slide Creator Skill

「資料作成して」「スライド作って」「提案書作って」「PPTX作って」などの依頼時に使用。
EC戦略・提案資料をPowerPoint形式で作成するスキル。

## 概要

python-pptxを使用して、テンプレートベースでプロフェッショナルな資料を生成する。
かっぴーのEC提案資料のデザイン・構成をベースにしている。

## テンプレート

- `templates/ec-strategy.pptx` - EC戦略資料テンプレート（18スライド構成）

## 使い方

### 1. 資料構成を決める

標準構成（EC戦略資料）:
1. タイトル（プロジェクト名、会社名、担当者）
2. 与件整理（課題、目的）
3. ターゲット分析（ペルソナ、市場）
4. 現状 vs 改善（比較図）
5-9. フェーズ別施策（短期・中期・長期）
10. カスタマージャーニーマップ
11-15. 具体施策詳細
16. 方針まとめ
17. スケジュール
18. 終わり

### 2. スクリプトで生成

```bash
python3 skills/slide-creator/generate.py \
  --template templates/ec-strategy.pptx \
  --output output.pptx \
  --config config.json
```

### 3. 設定ファイル（config.json）

```json
{
  "title": "〇〇サイト戦略",
  "company": "株式会社〇〇",
  "author": "担当者名",
  "slides": [
    {
      "type": "title",
      "title": "〇〇サイト戦略",
      "subtitle": "株式会社〇〇　担当者名"
    },
    {
      "type": "section",
      "title": "与件整理",
      "content": "課題と目的を記載"
    }
  ]
}
```

## スライドタイプ

| タイプ | 説明 | 必須項目 |
|--------|------|----------|
| title | タイトルスライド | title, subtitle |
| section | セクション見出し | title |
| content | 本文スライド | title, content |
| comparison | 比較スライド | title, left, right |
| journey | カスタマージャーニー | title, phases |
| schedule | スケジュール | title, phases |
| summary | まとめ | title, points |

## デザインガイドライン

このテンプレートの特徴:
- ヘッダー: 青グラデーション + ロゴ
- フォント: メイリオ/游ゴシック
- カラー: 青系（#1E4B8E, #2E6BC6）
- 図解多用、テキスト詰め込みすぎない
- フェーズ分けで構造化

## 注意事項

- 画像挿入は別途対応が必要
- 複雑な図解はPowerPointで手動調整推奨
- テンプレートのスライドマスターを変更しないこと
