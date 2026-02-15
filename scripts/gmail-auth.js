#!/usr/bin/env node
/**
 * Gmail OAuth2 再認証スクリプト
 * ブラウザが開くのでGoogleアカウントでログインしてください
 */
const { authenticate } = require('@google-cloud/local-auth');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-credentials.json');
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

async function main() {
  console.log('ブラウザが開きます。Googleアカウントでログインしてください...');
  
  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  // トークン保存
  const content = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const key = content.installed || content.web;
  const payload = {
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(payload));
  console.log('✅ 認証成功！トークンを保存しました。');
}

main().catch(e => {
  console.error('認証エラー:', e.message);
  process.exit(1);
});
