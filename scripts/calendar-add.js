#!/usr/bin/env node
/**
 * Google Calendar Add - カレンダーに予定追加
 * 
 * 使い方:
 * node calendar-add.js "タイトル" "2026-04-01T19:45:00" --reminders "1w,1d"
 */

const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');

// 設定
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-credentials.json');
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * 保存されたトークンを読み込む
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * 認証トークンを保存
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * 認証実行
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }

  // 新規認証が必要
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
 * リマインダー文字列をパース
 * 例: "1w,1d" → [1週間前, 1日前]
 */
function parseReminders(reminderStr) {
  if (!reminderStr) return [];
  
  const reminders = [];
  const parts = reminderStr.split(',');
  
  for (const part of parts) {
    const match = part.match(/^(\d+)([wdhm])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      
      let minutes;
      switch (unit) {
        case 'w': minutes = value * 7 * 24 * 60; break; // 週
        case 'd': minutes = value * 24 * 60; break;     // 日
        case 'h': minutes = value * 60; break;          // 時間
        case 'm': minutes = value; break;               // 分
      }
      
      reminders.push({ method: 'popup', minutes });
    }
  }
  
  return reminders;
}

/**
 * カレンダーに予定追加
 */
async function addEvent(auth, summary, startTime, description = '', reminders = []) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  const event = {
    summary: summary,
    description: description,
    start: {
      dateTime: startTime,
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(), // 1時間後
      timeZone: 'Asia/Tokyo',
    },
    reminders: {
      useDefault: false,
      overrides: reminders.length > 0 ? reminders : [
        { method: 'popup', minutes: 30 }, // デフォルト30分前
      ],
    },
  };
  
  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
  
  return res.data;
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('使い方: node calendar-add.js "タイトル" "2026-04-01T19:45:00" [--reminders "1w,1d"] [--description "説明"]');
    process.exit(1);
  }
  
  const summary = args[0];
  const startTime = args[1];
  
  // オプション解析
  let reminderStr = '';
  let description = '';
  
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--reminders' && args[i + 1]) {
      reminderStr = args[i + 1];
      i++;
    } else if (args[i] === '--description' && args[i + 1]) {
      description = args[i + 1];
      i++;
    }
  }
  
  console.log('カレンダー予定追加中...');
  console.log(`タイトル: ${summary}`);
  console.log(`日時: ${startTime}`);
  
  const auth = await authorize();
  const reminders = parseReminders(reminderStr);
  
  if (reminders.length > 0) {
    console.log('リマインダー:', reminders);
  }
  
  const event = await addEvent(auth, summary, startTime, description, reminders);
  
  console.log('✅ 予定追加完了');
  console.log(`イベントID: ${event.id}`);
  console.log(`リンク: ${event.htmlLink}`);
}

main().catch(console.error);
