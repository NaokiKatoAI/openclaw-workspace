#!/usr/bin/env node
/**
 * Gmail Reaction Check - Discordリアクション監視＆既読化
 * 
 * 機能：
 * - 保存されたメッセージIDのリアクションをチェック
 * - 👍があればGmailを既読化
 */

const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');

// 設定
const STATE_FILE = path.join(process.env.HOME, '.openclaw', 'gmail-state.json');
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
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
 * Gmailを既読化
 */
async function markAsRead(auth, messageIds) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  for (const id of messageIds) {
    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: id,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
      console.log(`既読化: ${id}`);
    } catch (err) {
      console.error(`既読化失敗 (${id}):`, err.message);
    }
  }
}

/**
 * OpenClaw message reactionsでリアクションをチェック
 */
async function checkReactions(messageId) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync(
      `openclaw message reactions --channel discord --target "channel:${DISCORD_CHANNEL_ID}" --message-id "${messageId}"`
    );
    
    // 出力から👍の存在を確認（JSON形式を想定）
    try {
      const reactions = JSON.parse(stdout);
      return reactions.some(r => r.emoji === '👍' || r.emoji.includes('thumbsup'));
    } catch {
      // JSON parseできない場合はテキスト検索
      return stdout.includes('👍') || stdout.includes('thumbsup');
    }
  } catch (err) {
    console.error('リアクション取得失敗:', err.message);
    return false;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('Gmail Reaction Check 起動...');

  // 状態ファイル読み込み
  let state;
  try {
    const content = await fs.readFile(STATE_FILE);
    state = JSON.parse(content);
  } catch {
    console.log('処理対象なし（状態ファイルなし）');
    return;
  }

  if (!state.lastMessageId || !state.toArchiveIds || state.toArchiveIds.length === 0) {
    console.log('処理対象なし');
    return;
  }

  // リトライロジック（最大2回）
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 3 * 60 * 1000; // 3分

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`リアクションチェック (${attempt}/${MAX_RETRIES})...`);
    
    const hasThumbsUp = await checkReactions(state.lastMessageId);

    if (hasThumbsUp) {
      console.log('👍検出！既読化実行');

      // Gmail認証
      const auth = await loadSavedCredentialsIfExist();
      if (!auth) {
        console.error('Gmail認証エラー');
        return;
      }

      // 既読化
      await markAsRead(auth, state.toArchiveIds);

      // 状態ファイル削除（処理完了）
      await fs.unlink(STATE_FILE);
      console.log('処理完了');
      return;
    }

    // リトライ判定
    if (attempt < MAX_RETRIES) {
      console.log(`👍なし。${RETRY_DELAY_MS / 60000}分後に再試行...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    } else {
      console.log('👍なし。リトライ上限到達、諦める');
      // 状態ファイル削除（処理終了）
      await fs.unlink(STATE_FILE);
    }
  }
}

main().catch(console.error);
