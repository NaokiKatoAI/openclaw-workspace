#!/usr/bin/env node

/**
 * 議事録データベースから全議事録を取得してローカルに保存
 * エイチーム全体会議を除く
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SECRETS_PATH = '/Users/katonaoki/.openclaw/notion-secrets.json';
const OUTPUT_DIR = '/Users/katonaoki/Documents/claw-projects/my-repo/notion-minutes';
const DATABASE_ID = '562dc69e607a4dacb51457a8dc47282b';

// シークレット読み込み
function loadSecrets() {
  return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8'));
}

// Notion API リクエスト
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

// ページのブロック（コンテンツ）取得
async function getPageBlocks(pageId) {
  const response = await notionRequest(`/v1/blocks/${pageId.replace(/-/g, '')}/children`);
  return response.results;
}

// ブロックからテキストを抽出
function extractTextFromBlock(block) {
  const type = block.type;
  if (!block[type]) return '';
  
  const richText = block[type].rich_text || block[type].text || [];
  return richText.map(t => t.plain_text).join('');
}

// 再帰的にブロックとその子要素のテキストを取得
async function getBlockTextRecursive(block, indent = '') {
  let text = '';
  const type = block.type;
  
  // ブロックタイプに応じた処理
  switch (type) {
    case 'paragraph':
      text = indent + extractTextFromBlock(block) + '\n';
      break;
    case 'heading_1':
      text = indent + '# ' + extractTextFromBlock(block) + '\n';
      break;
    case 'heading_2':
      text = indent + '## ' + extractTextFromBlock(block) + '\n';
      break;
    case 'heading_3':
      text = indent + '### ' + extractTextFromBlock(block) + '\n';
      break;
    case 'bulleted_list_item':
      text = indent + '- ' + extractTextFromBlock(block) + '\n';
      break;
    case 'numbered_list_item':
      text = indent + '1. ' + extractTextFromBlock(block) + '\n';
      break;
    case 'to_do':
      const checked = block.to_do.checked ? '[x]' : '[ ]';
      text = indent + `${checked} ` + extractTextFromBlock(block) + '\n';
      break;
    case 'toggle':
      text = indent + '> ' + extractTextFromBlock(block) + '\n';
      break;
    case 'quote':
      text = indent + '> ' + extractTextFromBlock(block) + '\n';
      break;
    case 'divider':
      text = indent + '---\n';
      break;
    default:
      text = indent + extractTextFromBlock(block) + '\n';
  }
  
  // has_children がtrueの場合、子ブロックも取得
  if (block.has_children) {
    try {
      const children = await getPageBlocks(block.id);
      for (const child of children) {
        text += await getBlockTextRecursive(child, indent + '  ');
      }
    } catch (e) {
      // 子要素取得失敗時はスキップ
    }
  }
  
  return text;
}

// ページ全体のテキストを取得
async function getPageText(pageId) {
  const blocks = await getPageBlocks(pageId);
  let text = '';
  
  for (const block of blocks) {
    text += await getBlockTextRecursive(block);
  }
  
  return text.trim();
}

// データベースクエリ
async function queryDatabase(databaseId) {
  const id = databaseId.replace(/-/g, '');
  const response = await notionRequest(`/v1/databases/${id}/query`, {
    method: 'POST',
    body: {}
  });
  
  return response.results;
}

// 議事録を保存
async function saveMinute(page, content) {
  const title = page.properties['議事録タイトル']?.title?.[0]?.plain_text || '(タイトルなし)';
  const date = page.properties['MTG日時']?.date?.start || 'no-date';
  const participants = page.properties['参加者']?.rich_text?.map(t => t.plain_text).join(', ') || '';
  const items = page.properties['項目']?.multi_select?.map(i => i.name).join(', ') || '';
  
  // ファイル名を安全にする
  const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
  const filename = `${date}_${safeTitle}.md`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Markdown形式で保存
  const markdown = `# ${title}

**MTG日時**: ${date}
**参加者**: ${participants}
**項目**: ${items}

---

${content}
`;
  
  fs.writeFileSync(filepath, markdown, 'utf8');
  return filepath;
}

// メイン処理
async function main() {
  console.log('📥 議事録データベースから取得中...\n');
  
  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // データベースクエリ
  const pages = await queryDatabase(DATABASE_ID);
  console.log(`📊 ${pages.length}件の議事録を発見\n`);
  
  let savedCount = 0;
  let skippedCount = 0;
  
  for (const page of pages) {
    const title = page.properties['議事録タイトル']?.title?.[0]?.plain_text || '(タイトルなし)';
    
    // エイチーム全体会議を除外
    if (title.includes('エイチーム全体会議') || title.includes('Ateam全体会議')) {
      console.log(`⏭️  スキップ: ${title}`);
      skippedCount++;
      continue;
    }
    
    try {
      console.log(`📄 処理中: ${title}`);
      const content = await getPageText(page.id);
      const filepath = await saveMinute(page, content);
      console.log(`   ✅ 保存: ${path.basename(filepath)}\n`);
      savedCount++;
      
      // API制限対策（レートリミット回避）
      await new Promise(resolve => setTimeout(resolve, 350));
    } catch (error) {
      console.error(`   ❌ エラー: ${error.message}\n`);
    }
  }
  
  console.log(`\n📝 完了: ${savedCount}件保存、${skippedCount}件スキップ`);
  console.log(`📂 保存先: ${OUTPUT_DIR}`);
}

main().catch(console.error);
