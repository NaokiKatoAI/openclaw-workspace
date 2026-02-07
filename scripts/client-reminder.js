#!/usr/bin/env node
/**
 * クライアントチャンネルの対応状況チェック
 * 最終メッセージが誰からのものかを確認し、リマインドが必要な場合に通知
 */

import { execSync } from 'child_process';

// かっぴーのユーザーID
const KAPPY_USER_ID = '1395009129755443260';
// ガッツ（bot）のユーザーID
const GUTTS_USER_ID = '1464876314799640647';
// クライアントカテゴリーID
const CLIENT_CATEGORY_ID = '1464976485415911436';

// クライアントチャンネルリスト
const CLIENT_CHANNELS = [
  { id: '1464976900853334151', name: 'フロムアイズ' },
  { id: '1465131303405092975', name: 'bico・ghi株式会社' },
  { id: '1467508496999125012', name: 'awc（大塚製薬）' },
  { id: '1467518880988794890', name: 'バルクオム' },
  { id: '1467518907165180110', name: 'ハイマート' },
  { id: '1467518957069275432', name: '箱根ガラスの森リゾート' },
  { id: '1468109213443293269', name: '01_楽楽関連' },
  { id: '1468111261316415602', name: 'sb-cs（上ちゃん）' }
];

// メッセージ取得
function getLatestMessage(channelId) {
  try {
    const cmd = `openclaw message read --target ${channelId} --limit 10`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const messages = JSON.parse(output);
    
    if (!messages || messages.length === 0) {
      return null;
    }
    
    // システムメッセージ・Embedを除外して最新のテキストメッセージを取得
    for (const msg of messages) {
      // システムメッセージ（type !== 0）を除外
      if (msg.type && msg.type !== 0) continue;
      // 内容がない、またはEmbedのみのメッセージを除外
      if (!msg.content || msg.content.trim() === '') continue;
      
      return msg;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching messages from ${channelId}:`, error.message);
    return null;
  }
}

// メッセージの日数計算
function getDaysSince(timestamp) {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now - messageDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

// メイン処理
async function main() {
  const reminders = [];
  
  for (const channel of CLIENT_CHANNELS) {
    const latestMsg = getLatestMessage(channel.id);
    
    if (!latestMsg) {
      console.log(`[${channel.name}] メッセージなし`);
      continue;
    }
    
    const authorId = latestMsg.author?.id;
    const daysSince = getDaysSince(latestMsg.timestamp);
    
    // 自分たち（かっぴー or ガッツ）からのメッセージ → 相手ボール
    if (authorId === KAPPY_USER_ID || authorId === GUTTS_USER_ID) {
      if (daysSince >= 3) {
        reminders.push({
          channel: channel.name,
          status: '相手ボール（返信待ち）',
          days: daysSince,
          lastMessage: latestMsg.content.substring(0, 50)
        });
      }
    }
    // 相手からのメッセージ → こっちボール
    else {
      if (daysSince >= 1) {
        reminders.push({
          channel: channel.name,
          status: 'こっちボール（対応必要）',
          days: daysSince,
          lastMessage: latestMsg.content.substring(0, 50),
          urgent: daysSince >= 3
        });
      }
    }
  }
  
  // リマインド送信
  if (reminders.length === 0) {
    console.log('✅ リマインド不要（全チャンネル対応済み）');
    return;
  }
  
  let message = '🔔 **クライアント対応状況リマインド**\n\n';
  
  // 緊急（こっちボール）を先に
  const urgent = reminders.filter(r => r.urgent);
  const normal = reminders.filter(r => !r.urgent);
  
  if (urgent.length > 0) {
    message += '🚨 **緊急（3日以上経過）**\n';
    for (const r of urgent) {
      message += `• **${r.channel}**: ${r.status}（${r.days}日経過）\n`;
      message += `  └ 最終: ${r.lastMessage}...\n`;
    }
    message += '\n';
  }
  
  if (normal.length > 0) {
    message += '📋 **通常リマインド**\n';
    for (const r of normal) {
      message += `• **${r.channel}**: ${r.status}（${r.days}日経過）\n`;
      message += `  └ 最終: ${r.lastMessage}...\n`;
    }
  }
  
  // かっぴーに送信
  const cmd = `openclaw message send --channel 1397895052965187587 --message "${message.replace(/"/g, '\\"')}"`;
  execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
  
  console.log('✅ リマインド送信完了');
}

main().catch(console.error);
