#!/usr/bin/env node
/**
 * Gmail Reaction Check - Discordリアクション監視＆既読化
 * 
 * 機能：
 * - 保存されたメッセージIDのリアクションをチェック
 * - 👍があればGmailを既読化
 * - なければ30分後に再チェックを予約（次のメールチェックまで繰り返す）
 */

const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 設定
const STATE_FILE = path.join(process.env.HOME, '.openclaw', 'gmail-state.json');
const TOKEN_PATH = path.join(process.env.HOME, '.openclaw', 'gmail-token.json');
const DISCORD_CHANNEL_ID = process.env.GMAIL_DISCORD_CHANNEL || '1468591889627484396';

// メールチェック時刻（JST）- これを過ぎたら再予約しない
const MAIL_CHECK_HOURS = [8, 11, 14, 17, 20];

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function markAsRead(auth, messageIds) {
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.batchModify({
    userId: 'me',
    requestBody: {
      ids: messageIds,
      removeLabelIds: ['UNREAD'],
    },
  });
  console.error(`${messageIds.length}件を既読化しました`);
}

async function checkReactions(messageId) {
  try {
    const { stdout } = await execAsync(
      `openclaw message reactions --channel discord --target "channel:${DISCORD_CHANNEL_ID}" --message-id "${messageId}"`
    );
    try {
      const reactions = JSON.parse(stdout);
      return reactions.some(r => r.emoji === '👍' || (r.emoji && r.emoji.includes('thumbsup')));
    } catch {
      return stdout.includes('👍') || stdout.includes('thumbsup');
    }
  } catch (err) {
    console.error('リアクション取得失敗:', err.message);
    return false;
  }
}

/**
 * 次のメールチェック時刻までに30分後があるか判定
 */
function shouldReschedule() {
  const now = new Date();
  // JST = UTC+9
  const jstHour = (now.getUTCHours() + 9) % 24;
  const jstMin = now.getUTCMinutes();
  const currentMinutes = jstHour * 60 + jstMin;
  const in30min = currentMinutes + 30;

  // 次のメールチェック時刻を探す
  for (const h of MAIL_CHECK_HOURS) {
    const checkMinutes = h * 60;
    if (checkMinutes > currentMinutes) {
      // 30分後が次のチェック時刻より前なら再予約OK
      return in30min < checkMinutes;
    }
  }
  // 今日の最後のチェック（20:00）を過ぎてたら、翌朝8:00まで
  // 30分後に再チェックしても意味あるので再予約する（22:00まで）
  return jstHour < 22;
}

async function scheduleNextCheck() {
  if (!shouldReschedule()) {
    console.error('次のメールチェックが近いため再予約しない');
    return;
  }
  try {
    const cronCmd = `openclaw cron add --name "Gmail👍チェック（30分後）" --at "30m" --session main --system-event "Gmail👍チェック: node ~/Documents/claw-projects/my-repo/scripts/gmail-reaction-check.js を実行しろ" --delete-after-run`;
    await execAsync(cronCmd);
    console.error('30分後に再チェック予約完了');
  } catch (err) {
    console.error('再チェック予約失敗:', err.message);
  }
}

async function main() {
  console.error('Gmail Reaction Check 起動...');

  let state;
  try {
    const content = await fs.readFile(STATE_FILE);
    state = JSON.parse(content);
  } catch {
    console.error('処理対象なし（状態ファイルなし）');
    return;
  }

  if (!state.lastMessageId || !state.toArchiveIds || state.toArchiveIds.length === 0) {
    console.error('処理対象なし');
    return;
  }

  console.error(`リアクションチェック中... (メッセージID: ${state.lastMessageId})`);
  const hasThumbsUp = await checkReactions(state.lastMessageId);

  if (hasThumbsUp) {
    console.error('👍検出！既読化実行');
    const auth = await loadSavedCredentialsIfExist();
    if (!auth) {
      console.error('Gmail認証エラー');
      return;
    }
    await markAsRead(auth, state.toArchiveIds);
    await fs.unlink(STATE_FILE).catch(() => {});
    console.error('処理完了');
  } else {
    console.error('👍なし。30分後に再チェック予約...');
    await scheduleNextCheck();
  }
}

main().catch(console.error);
