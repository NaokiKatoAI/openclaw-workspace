#!/usr/bin/env node
/**
 * 案件ステータス管理スクリプト
 * 使い方：
 *   node scripts/project-status.js <action> <channelId> [args]
 * 
 * Actions:
 *   update <channelId> <status> [projectName] - ステータス更新
 *   get <channelId> - 現在のステータス取得
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// クライアントマッピング読み込み
const mappingPath = path.join(__dirname, '../config/client-notion-mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// ステータス定義
const STATUSES = {
  '案件作成': { next: '見積もり作成済み', action: '見積もり作成' },
  '見積もり作成済み': { next: '見積もり送付済み', action: '見積もり送付' },
  '見積もり送付済み': { next: '見積もり承認済み', action: '見積もり承認待ち' },
  '見積もり承認済み': { next: '作業中', action: '作業開始' },
  '作業中': { next: '作業完了', action: '先方確認依頼' },
  '作業完了': { next: '先方OK', action: '先方OK待ち' },
  '先方OK': { next: '検収書作成済み', action: '検収書作成' },
  '検収書作成済み': { next: '検収書送付済み', action: '検収書送付' },
  '検収書送付済み': { next: '検収書承認済み', action: '検収書承認待ち' },
  '検収書承認済み': { next: '請求書発行済み', action: '請求書発行' },
  '請求書発行済み': { next: '完了', action: '入金確認' },
  '完了': { next: null, action: '完了' }
};

// キーワードマッピング
const KEYWORD_MAP = {
  '見積もり送った': '見積もり送付済み',
  '見積もり承認': '見積もり承認済み',
  '見積OK': '見積もり承認済み',
  '作業開始': '作業中',
  '作業完了': '作業完了',
  '完了した': '作業完了',
  '先方OK': '先方OK',
  'OKもらった': '先方OK',
  '検収書送った': '検収書送付済み',
  '検収書返ってきた': '検収書承認済み',
  '検収書承認': '検収書承認済み',
  '納品完了': '検収書承認済み',
  '請求書送った': '請求書発行済み',
  '請求書発行': '請求書発行済み',
  '完了': '完了'
};

const action = process.argv[2];
const channelId = process.argv[3];

if (!action || !channelId) {
  console.error('Usage: node project-status.js <action> <channelId> [args]');
  process.exit(1);
}

const clientInfo = mapping.channels[channelId];
if (!clientInfo) {
  console.error(`❌ クライアント情報が見つかりません: ${channelId}`);
  process.exit(1);
}

// Notion認証情報読み込み
const secretsPath = path.join(process.env.HOME, '.openclaw/notion-secrets.json');
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));

async function updateStatus(status, projectName = null) {
  const now = new Date().toISOString().split('T')[0];
  const nextAction = STATUSES[status]?.action || '確認';
  
  const content = `
【現在の案件】${projectName ? `\n案件名: ${projectName}` : ''}
ステータス: ${status}
最終更新: ${now}
次のアクション: ${nextAction}
`;

  // Notion APIで追加
  const command = `node scripts/notion-client-append.js "${channelId}" "${content.replace(/\n/g, '\\n')}"`;
  execSync(command, { stdio: 'inherit' });
  
  console.log(`✅ ステータス更新: ${status}`);
  console.log(`📋 次のアクション: ${nextAction}`);
}

async function getStatus() {
  // Notionから最新ステータス取得（実装簡略化）
  console.log(`📊 ${clientInfo.name}の案件状況を確認中...`);
  console.log(`💡 Notionページ: ${clientInfo.notionPageId}`);
}

// メイン処理
(async () => {
  try {
    switch (action) {
      case 'update':
        const status = process.argv[4];
        const projectName = process.argv[5];
        await updateStatus(status, projectName);
        break;
      
      case 'get':
        await getStatus();
        break;
      
      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
})();
