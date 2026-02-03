#!/usr/bin/env node
/**
 * Notionクライアント管理DBから最新のクライアントリストを取得してマッピングを更新
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SECRETS_PATH = path.join(process.env.HOME, '.openclaw/notion-secrets.json');
const MAPPING_PATH = path.join(__dirname, '../config/client-notion-mapping.json');

function loadSecrets() {
  return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8'));
}

function loadMapping() {
  return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
}

function saveMapping(mapping) {
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2));
}

function notionRequest(endpoint, options = {}) {
  const secrets = loadSecrets();
  
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
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`Notion API Error: ${parsed.message || data}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
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

async function syncClients() {
  const mapping = loadMapping();
  const databaseId = mapping.database.id;
  
  console.log('📊 Notionクライアント管理DBから最新情報を取得中...\n');
  
  const response = await notionRequest(`/v1/databases/${databaseId}/query`, {
    method: 'POST',
    body: {}
  });
  
  console.log('✅ クライアント一覧:\n');
  
  const clients = {};
  
  response.results.forEach(page => {
    const clientName = page.properties['クライアント名']?.title?.[0]?.plain_text || 
                       page.properties.Name?.title?.[0]?.plain_text || 
                       '(名前なし)';
    
    const pageId = page.id;
    
    console.log(`📄 ${clientName}`);
    console.log(`   ID: ${pageId}`);
    console.log(`   URL: https://notion.so/${pageId.replace(/-/g, '')}`);
    
    // 既存のマッピングからDiscordチャンネルIDを探す
    let channelId = null;
    for (const [chId, info] of Object.entries(mapping.channels)) {
      if (info.notionPageId === pageId) {
        channelId = chId;
        console.log(`   📱 Discord: ${info.name} (${chId})`);
        break;
      }
    }
    
    if (!channelId) {
      console.log(`   ⚠️  Discordチャンネルと未紐付け`);
    }
    
    console.log('');
    
    clients[clientName] = {
      pageId: pageId,
      channelId: channelId
    };
  });
  
  console.log('\n📋 マッピング状況:');
  console.log(`   - データベース内クライアント数: ${Object.keys(clients).length}`);
  console.log(`   - Discord連携済み: ${Object.values(clients).filter(c => c.channelId).length}`);
  console.log(`   - 未連携: ${Object.values(clients).filter(c => !c.channelId).length}`);
  
  return clients;
}

syncClients().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
