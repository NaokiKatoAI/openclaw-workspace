#!/usr/bin/env node

/**
 * Notion連携ヘルパー
 * ページ内容の取得、ファイルのダウンロードなど
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SECRETS_PATH = '/Users/katonaoki/.openclaw/notion-secrets.json';
const DOWNLOADS_DIR = '/Users/katonaoki/Documents/claw-projects/my-repo/downloads';

// シークレット読み込み
function loadSecrets() {
  if (!fs.existsSync(SECRETS_PATH)) {
    throw new Error('Notion API key not found. Run setup first.');
  }
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

// ページIDを正規化（URLからIDを抽出）
function normalizePageId(input) {
  // URL形式の場合
  if (input.includes('notion.so/')) {
    const match = input.match(/([a-f0-9]{32})|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    if (match) {
      return match[0].replace(/-/g, '');
    }
  }
  // すでにID形式の場合
  return input.replace(/-/g, '');
}

// ページ情報取得
async function getPage(pageId) {
  const id = normalizePageId(pageId);
  return await notionRequest(`/v1/pages/${id}`);
}

// ページのブロック（コンテンツ）取得
async function getPageBlocks(pageId) {
  const id = normalizePageId(pageId);
  const response = await notionRequest(`/v1/blocks/${id}/children`);
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
  let text = indent + extractTextFromBlock(block) + '\n';
  
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

// ファイルブロックを検出
async function findFiles(pageId) {
  const blocks = await getPageBlocks(pageId);
  const files = [];
  
  for (const block of blocks) {
    if (block.type === 'file') {
      files.push({
        name: block.file.name || 'unnamed',
        url: block.file.file?.url || block.file.external?.url,
        type: 'file',
        blockId: block.id
      });
    } else if (block.type === 'image') {
      files.push({
        name: 'image',
        url: block.image.file?.url || block.image.external?.url,
        type: 'image',
        blockId: block.id
      });
    }
  }
  
  return files;
}

// ファイルをダウンロード
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }
    
    const filepath = path.join(DOWNLOADS_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  let pageId = args[1];
  
  // デフォルトページを使用
  if (!pageId) {
    const secrets = loadSecrets();
    if (secrets.defaultPage && secrets.defaultPage.id) {
      pageId = secrets.defaultPage.id;
      console.log(`📄 デフォルトページ「${secrets.defaultPage.name}」を使用`);
    }
  }
  
  if (!command || !pageId) {
    console.log(`使い方:
  node notion-helper.js page [pageId|URL]     - ページ情報取得（省略時はデフォルトページ）
  node notion-helper.js text [pageId|URL]     - ページテキスト取得
  node notion-helper.js files [pageId|URL]    - ファイル一覧取得
  node notion-helper.js download [pageId|URL] - ファイルダウンロード
`);
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'page':
        const page = await getPage(pageId);
        console.log(JSON.stringify(page, null, 2));
        break;
        
      case 'text':
        const text = await getPageText(pageId);
        console.log(text);
        break;
        
      case 'files':
        const files = await findFiles(pageId);
        console.log(JSON.stringify(files, null, 2));
        break;
        
      case 'download':
        const foundFiles = await findFiles(pageId);
        console.log(`📥 ${foundFiles.length}個のファイルをダウンロード中...`);
        for (const file of foundFiles) {
          const filepath = await downloadFile(file.url, file.name);
          console.log(`✅ ${filepath}`);
        }
        break;
        
      default:
        console.error(`未知のコマンド: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getPage,
  getPageBlocks,
  getPageText,
  findFiles,
  downloadFile
};
