#!/usr/bin/env node
/**
 * Google Drive File Uploader
 * 
 * Usage: node gdrive-upload.js <filePath> [--name <fileName>] [--folder <folderId>]
 * 
 * デフォルトフォルダ: OpenClaw共有フォルダ
 * 出力: アップロード後の共有URLを標準出力に表示
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { google } = require('googleapis');

// 設定
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-credentials.json');
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gdrive-token.json');
const GMAIL_TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-token.json');
const DEFAULT_FOLDER_ID = '1BISfRfSTizEShR-ocLgHVEhF5wuEUblf';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * 保存されたトークンを読み込む
 */
async function loadSavedCredentials() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch {
    return null;
  }
}

/**
 * トークンを保存
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = {
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  };
  await fs.writeFile(TOKEN_PATH, JSON.stringify(payload, null, 2));
}

/**
 * 認証
 */
async function authorize() {
  let client = await loadSavedCredentials();
  if (client) return client;

  // Drive専用トークンがなければ、対話的に認証
  const { authenticate } = require('@google-cloud/local-auth');
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * MIMEタイプ推定
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.zip': 'application/zip',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * ファイルアップロード
 */
async function uploadFile(auth, filePath, fileName, folderId) {
  const drive = google.drive({ version: 'v3', auth });
  
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: getMimeType(filePath),
    body: fsSync.createReadStream(filePath),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink',
  });

  // 「リンクを知っている全員が閲覧可能」に設定
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // 共有リンクを再取得
  const file = await drive.files.get({
    fileId: res.data.id,
    fields: 'id, name, webViewLink, webContentLink',
  });

  return file.data;
}

/**
 * メイン
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node gdrive-upload.js <filePath> [--name <fileName>] [--folder <folderId>]');
    process.exit(1);
  }

  const filePath = args[0];
  let fileName = path.basename(filePath);
  let folderId = DEFAULT_FOLDER_ID;

  // オプション解析
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      fileName = args[++i];
    } else if (args[i] === '--folder' && args[i + 1]) {
      folderId = args[++i];
    }
  }

  // ファイル存在確認
  try {
    await fs.access(filePath);
  } catch {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const auth = await authorize();
  const file = await uploadFile(auth, filePath, fileName, folderId);

  console.log(JSON.stringify({
    id: file.id,
    name: file.name,
    url: file.webViewLink,
    downloadUrl: file.webContentLink,
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
