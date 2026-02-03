#!/usr/bin/env node
/**
 * Notionクライアント別ページ書き込みスクリプト
 * 使い方: node scripts/notion-client-append.js <channelId> <content>
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

// チャンネルマッピング読み込み
const mappingPath = path.join(__dirname, '../config/client-notion-mapping.json');
let mapping;
try {
  mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
} catch (err) {
  console.error('❌ マッピングファイルが見つかりません:', mappingPath);
  process.exit(1);
}

async function appendToClientPage(channelId, content) {
  // チャンネルIDからNotionページIDを取得
  const client = mapping.channels[channelId];
  
  if (!client) {
    console.error(`❌ チャンネルID ${channelId} がマッピングに存在しません`);
    console.log('登録されているチャンネル:');
    Object.entries(mapping.channels).forEach(([id, info]) => {
      console.log(`  - ${info.name} (${id})`);
    });
    process.exit(1);
  }

  const pageId = client.notionPageId;
  console.log(`📝 クライアント: ${client.name}`);
  console.log(`📄 Notionページ: ${pageId}`);

  try {
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    
    // ページに新しいブロックを追加
    const response = await notionRequest(`/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      body: {
        children: [
          {
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `📅 ${timestamp}`
                  }
                }
              ]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      }
    });

    console.log('✅ 書き込み成功');
    console.log(`📄 URL: https://notion.so/${pageId.replace(/-/g, '')}`);
    return response;
  } catch (error) {
    console.error('❌ 書き込みエラー:', error.message || error);
    process.exit(1);
  }
}

// コマンドライン引数処理
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('使い方: node scripts/notion-client-append.js <channelId> <content>');
  console.log('\n登録されているチャンネル:');
  Object.entries(mapping.channels).forEach(([id, info]) => {
    console.log(`  - ${info.name} (${id})`);
  });
  process.exit(1);
}

const [channelId, ...contentParts] = args;
const content = contentParts.join(' ');

appendToClientPage(channelId, content);
