#!/usr/bin/env node

/**
 * IT・AI関連補助金情報 週次収集スクリプト
 * 毎週月曜9:00実行
 */

const SEARCH_KEYWORDS = [
  'IT導入補助金 2026',
  'AI 補助金 2026',
  '事業再構築補助金 AI',
  'ものづくり補助金 DX',
  'デジタル化支援 補助金'
];

const SEARCH_SOURCES = [
  'https://www.meti.go.jp/',  // 経産省
  'https://www.smrj.go.jp/',  // 中小企業基盤整備機構
  'https://it-shien.smrj.go.jp/'  // IT導入補助金
];

console.log('📋 IT・AI関連補助金情報を収集中...');
console.log('検索キーワード:', SEARCH_KEYWORDS.join(', '));
console.log('');
console.log('⚠️ 実際の検索はOpenClawのagentTurnで実行されます');
