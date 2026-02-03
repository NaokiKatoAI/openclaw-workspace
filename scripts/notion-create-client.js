#!/usr/bin/env node
/**
 * Notionクライアント管理DBに新しいクライアントページを作成
 * 使い方: node scripts/notion-create-client.js <クライアント名>
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Notion APIキー読み込み
const secretsPath = path.join(process.env.HOME, '.openclaw/notion-secrets.json');
let secrets;
try {
  secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
} catch (err) {
  console.error('❌ Notionシークレットファイルが見つかりません:', secretsPath);
  process.exit(1);
}

// Notion API リクエスト
function notionRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.notion.com',
      path: endpoint,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${secrets.notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.error('❌ APIエラー:', res.statusCode);
          console.error('Response:', data);
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function createClientPage(clientName) {
  const DATABASE_ID = '250fa1d8-cd3d-461c-a9c2-854b2e99804d';
  
  try {
    console.log(`📝 クライアント「${clientName}」のページを作成中...`);
    
    const response = await notionRequest('/v1/pages', {
      method: 'POST',
      body: {
        parent: { database_id: DATABASE_ID },
        properties: {
          'クライアント名': {
            title: [{ text: { content: clientName } }]
          }
        }
      }
    });

    console.log('✅ ページ作成完了');
    console.log('ID:', response.id);
    console.log('URL:', response.url);
    
    return response;
  } catch (err) {
    console.error('❌ エラー:', err.message);
    process.exit(1);
  }
}

// メイン
const clientName = process.argv[2];
if (!clientName) {
  console.error('使い方: node scripts/notion-create-client.js <クライアント名>');
  process.exit(1);
}

createClientPage(clientName);
