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
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 設定
const CREDENTIALS_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-credentials.json');
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// Discord通知先チャンネルID
const DISCORD_CHANNEL_ID = process.env.GMAIL_DISCORD_CHANNEL || '1468591889627484396';

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
 * 学習データを読み込む
 */
async function loadFilters() {
  const filterPath = path.join(process.env.HOME, '.openclaw', 'gmail-filters.json');
  try {
    const content = await fs.readFile(filterPath, 'utf8');
    return JSON.parse(content);
  } catch {
    // フィルターファイルがない場合はデフォルト
    return { unimportant: [], important: [], keywords: { unimportant: [], important: [] }, special_rules: {} };
  }
}

/**
 * メールを分類
 */
async function classifyMessages(messages) {
  const filters = await loadFilters();
  const important = [];
  const toArchive = [];

  for (const msg of messages) {
    const from = msg.headers.find(h => h.name === 'From')?.value || '';
    const subject = msg.headers.find(h => h.name === 'Subject')?.value || '';
    const text = `${from} ${subject} ${msg.snippet}`;

    let isImportant = false;
    let isUnimportant = false;

    // 美容室チェック（特別ルール）
    if (filters.special_rules?.beauty_salon?.important) {
      const beautyKeywords = filters.special_rules.beauty_salon.keywords || [];
      if (beautyKeywords.some(kw => text.includes(kw))) {
        isImportant = true;
      }
    }

    // Amazonチェック（特別ルール）
    if (from.includes('amazon.co.jp')) {
      const amazonImportantKeywords = filters.keywords.important || [];
      if (amazonImportantKeywords.some(kw => subject.includes(kw))) {
        isImportant = true;
      } else {
        // Amazon新刊案内やセールは重要じゃない
        isUnimportant = true;
      }
    }

    // 重要キーワードチェック
    if (!isImportant && filters.keywords.important) {
      if (filters.keywords.important.some(kw => text.includes(kw))) {
        isImportant = true;
      }
    }

    // 重要じゃないドメイン/送信者チェック
    if (!isImportant && filters.unimportant) {
      for (const rule of filters.unimportant) {
        if (from.includes(rule.from) || from.includes(rule.domain)) {
          isUnimportant = true;
          break;
        }
      }
    }

    // 重要じゃないキーワードチェック
    if (!isImportant && !isUnimportant && filters.keywords.unimportant) {
      if (filters.keywords.unimportant.some(kw => text.includes(kw))) {
        isUnimportant = true;
      }
    }

    if (isImportant) {
      important.push({ ...msg, from, subject });
    } else {
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

  const totalCount = important.length + toArchive.length;

  if (important.length > 0) {
    content += `🔴 **重要：${important.length}件**\n\n`;
    important.slice(0, 5).forEach(msg => {
      const shortSubject = msg.subject.length > 50 ? msg.subject.substring(0, 50) + '...' : msg.subject;
      const shortFrom = msg.from.length > 30 ? msg.from.substring(0, 30) + '...' : msg.from;
      const snippet = msg.snippet.length > 80 ? msg.snippet.substring(0, 80) + '...' : msg.snippet;
      content += `**📧 ${shortSubject}**\n`;
      content += `　From: ${shortFrom}\n`;
      content += `　内容: ${snippet}\n\n`;
    });
    if (important.length > 5) {
      content += `他${important.length - 5}件の重要メールがございます\n\n`;
    }
  }

  if (toArchive.length > 0) {
    content += `🟢 **既読候補：${toArchive.length}件**\n`;
    toArchive.slice(0, 5).forEach(msg => {
      const shortSubject = msg.subject.length > 40 ? msg.subject.substring(0, 40) + '...' : msg.subject;
      const shortFrom = msg.from.length > 30 ? msg.from.substring(0, 30) + '...' : msg.from;
      content += `- ${shortSubject}\n`;
      content += `  From: ${shortFrom}\n`;
    });
    if (toArchive.length > 5) {
      content += `- 他${toArchive.length - 5}件\n`;
    }
  }

  if (important.length === 0 && toArchive.length === 0) {
    content = `📬 **メールチェック結果（${timeStr}）**\n\n✅ 未読メールはございません`;
  }

  // OpenClaw message ツールを使って送信
  // メッセージをファイルに一時保存（改行・特殊文字対策）
  const tmpFile = path.join(process.env.HOME, '.openclaw', 'gmail-message-tmp.txt');
  await fs.writeFile(tmpFile, content);

  let messageId = null;
  try {
    // メール一覧を送信
    await execAsync(
      `openclaw message send --channel discord --target "channel:${DISCORD_CHANNEL_ID}" --message "$(cat ${tmpFile})"`
    );
    console.error('Discord通知成功（メール一覧）');

    // リアクション指示を別メッセージで送信（未読メールがある場合のみ）
    if (totalCount > 0) {
      const confirmMsg = `✅ ご確認いただけましたら👍リアクションをお願いいたします（全${totalCount}件を既読化いたします）`;
      const confirmTmpFile = path.join(process.env.HOME, '.openclaw', 'gmail-confirm-tmp.txt');
      await fs.writeFile(confirmTmpFile, confirmMsg);
      const { stdout: confirmStdout } = await execAsync(
        `openclaw message send --channel discord --target "channel:${DISCORD_CHANNEL_ID}" --message "$(cat ${confirmTmpFile})"`
      );
      await fs.unlink(confirmTmpFile).catch(() => {});
      // リアクション指示メッセージのIDを取得（こっちに👍をもらう）
      const confirmIdMatch = confirmStdout.match(/id[:\s]+['"]?(\d+)['"]?/i);
      if (confirmIdMatch) {
        messageId = confirmIdMatch[1];
        console.error('リアクション指示メッセージID:', messageId);
      }
    }
    console.error('Discord通知成功');
    
  } catch (err) {
    console.error('Discord通知失敗:', err.message);
  }
  
  // 一時ファイル削除
  await fs.unlink(tmpFile).catch(() => {});

  // メッセージIDとGmail IDのマッピングを保存（重要メール＋既読候補すべて）
  if (messageId && (important.length > 0 || toArchive.length > 0)) {
    const stateFile = path.join(process.env.HOME, '.openclaw', 'gmail-state.json');
    const allMessageIds = [
      ...important.map(m => m.id),
      ...toArchive.map(m => m.id)
    ];
    const state = {
      lastMessageId: messageId,
      toArchiveIds: allMessageIds,
      timestamp: Date.now(),
    };
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    console.error('状態保存完了');
    
    // 30分後にリアクションチェックを予約
    try {
      const cronCmd = `openclaw cron add --name "Gmail👍チェック（30分後）" --at "30m" --session main --system-event "Gmail👍チェック: node ~/Documents/claw-projects/my-repo/scripts/gmail-reaction-check.js を実行しろ" --delete-after-run`;
      await execAsync(cronCmd);
      console.error('30分後リアクションチェック予約完了');
    } catch (err) {
      console.error('リアクションチェック予約失敗:', err.message);
    }
  }

  console.error('Discord通知送信完了');
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

  console.error(`${messageIds.length}件のメールを既読化しました`);
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.error('Gmail Monitor 起動...');
    
    const auth = await authorize();
    console.error('認証成功');

    const messages = await getUnreadMessages(auth);
    console.error(`未読メール: ${messages.length}件`);

    if (messages.length === 0) {
      await sendToDiscord([], []);
      return;
    }

    const { important, toArchive } = await classifyMessages(messages);
    console.error(`重要: ${important.length}件、既読候補: ${toArchive.length}件`);

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
      
      console.error('既読化完了');
    } catch (error) {
      console.error('既読化エラー:', error);
      process.exit(1);
    }
  })();
} else {
  main();
}
