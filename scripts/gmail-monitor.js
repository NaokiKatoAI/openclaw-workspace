#!/usr/bin/env node
/**
 * Gmail Monitor - メール自動チェック＆整理
 * 
 * 機能：
 * - 未読メールを取得・分類
 * - 重要メール/既読候補をDiscordに通知
 * - リアクションで既読化
 */

const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');

// 設定
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-credentials.json');
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// Discord Webhook URL（環境変数から取得）
const WEBHOOK_URL = process.env.GMAIL_DISCORD_WEBHOOK || 'https://discord.com/api/webhooks/1468154343789428827/Tr3kepGXLPvuRWJZ2mVOgg20o0apI1WRJq_8f8ALv3WOC_0g64zStDkSGEmAk9xAnAOY';

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
 * トークンを保存
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
 * 認証して Gmail クライアントを取得
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
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
 * 未読メールを取得
 */
async function getUnreadMessages(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 50,
  });

  const messages = res.data.messages || [];
  
  if (messages.length === 0) {
    return [];
  }

  // メール詳細を取得
  const detailedMessages = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });
      return {
        id: msg.id,
        threadId: msg.threadId,
        headers: detail.data.payload.headers,
        snippet: detail.data.snippet,
        internalDate: detail.data.internalDate,
      };
    })
  );

  return detailedMessages;
}

/**
 * メールを分類
 */
function classifyMessages(messages) {
  const important = [];
  const toArchive = [];

  const importantKeywords = [
    '予約', '美容室', '歯医者', '配送', '到着', '発送', '請求', '支払', '期限',
    '会議', 'ミーティング', 'セミナー', 'イベント', '締切', '納品', '検収'
  ];

  const archivePatterns = [
    /newsletter|メルマガ|配信停止/i,
    /no-?reply@|noreply@/i,
    /amazon.*おすすめ|楽天.*セール/i,
    /twitter|facebook|instagram|notification/i,
    /広告|プロモーション|キャンペーン/i,
  ];

  for (const msg of messages) {
    const from = msg.headers.find(h => h.name === 'From')?.value || '';
    const subject = msg.headers.find(h => h.name === 'Subject')?.value || '';
    const text = `${from} ${subject} ${msg.snippet}`;

    // 重要メール判定
    const isImportant = importantKeywords.some(keyword => text.includes(keyword));
    
    // 既読候補判定
    const shouldArchive = archivePatterns.some(pattern => pattern.test(text));

    if (isImportant) {
      important.push({ ...msg, from, subject });
    } else if (shouldArchive) {
      toArchive.push({ ...msg, from, subject });
    } else {
      // どちらでもない場合は既読候補に
      toArchive.push({ ...msg, from, subject });
    }
  }

  return { important, toArchive };
}

/**
 * Discord に通知
 */
async function sendToDiscord(important, toArchive) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  let content = `📬 **メールチェック結果（${timeStr}）**\n\n`;

  if (important.length > 0) {
    content += `🔴 **重要：${important.length}件**\n`;
    important.slice(0, 5).forEach(msg => {
      const shortSubject = msg.subject.length > 50 ? msg.subject.substring(0, 50) + '...' : msg.subject;
      const shortFrom = msg.from.length > 30 ? msg.from.substring(0, 30) + '...' : msg.from;
      content += `- ${shortSubject}（${shortFrom}）\n`;
    });
    if (important.length > 5) {
      content += `- 他${important.length - 5}件\n`;
    }
    content += '\n';
  }

  if (toArchive.length > 0) {
    content += `🟢 **既読候補：${toArchive.length}件**\n`;
    toArchive.slice(0, 5).forEach(msg => {
      const shortSubject = msg.subject.length > 40 ? msg.subject.substring(0, 40) + '...' : msg.subject;
      content += `- ${shortSubject}\n`;
    });
    if (toArchive.length > 5) {
      content += `- 他${toArchive.length - 5}件\n`;
    }
    content += '\n👍このリアクション押したら既読化するぜ\n';
  }

  if (important.length === 0 && toArchive.length === 0) {
    content = `📬 **メールチェック結果（${timeStr}）**\n\n✅ 未読メールなし`;
  }

  const payload = {
    content: content,
    username: 'Gmail Monitor',
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord通知失敗: ${response.status}`);
  }

  const result = await response.json();
  
  // メッセージIDを保存（リアクション検知用）
  if (toArchive.length > 0) {
    const stateFile = path.join(process.env.HOME, '.openclaw', 'gmail-state.json');
    const state = {
      lastMessageId: result.id,
      toArchiveIds: toArchive.map(m => m.id),
      timestamp: Date.now(),
    };
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
  }

  console.log('Discord通知送信完了');
}

/**
 * メールを既読にする
 */
async function markAsRead(auth, messageIds) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: messageIds,
      removeLabelIds: ['UNREAD'],
    },
  });

  console.log(`${messageIds.length}件のメールを既読化しました`);
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('Gmail Monitor 起動...');
    
    const auth = await authorize();
    console.log('認証成功');

    const messages = await getUnreadMessages(auth);
    console.log(`未読メール: ${messages.length}件`);

    if (messages.length === 0) {
      await sendToDiscord([], []);
      return;
    }

    const { important, toArchive } = classifyMessages(messages);
    console.log(`重要: ${important.length}件、既読候補: ${toArchive.length}件`);

    await sendToDiscord(important, toArchive);

  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

// コマンドライン引数で既読化実行
if (process.argv[2] === 'mark-read') {
  (async () => {
    try {
      const stateFile = path.join(process.env.HOME, '.openclaw', 'gmail-state.json');
      const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
      
      const auth = await authorize();
      await markAsRead(auth, state.toArchiveIds);
      
      console.log('既読化完了');
    } catch (error) {
      console.error('既読化エラー:', error);
      process.exit(1);
    }
  })();
} else {
  main();
}
