#!/usr/bin/env node
/**
 * OpenClaw Cron Monitor
 * 毎朝8:30に実行して、AI・ECニュース（8:00配信）が来ているかチェック
 * 配信されていなければかっぴーにDM送信
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 設定
const NEWS_CHANNEL_ID = '1467503722744774860'; // Discord #news
const KAPPY_USER_ID = '1395009129755443260';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || loadTokenFromConfig();

function loadTokenFromConfig() {
  try {
    const configPath = path.join(process.env.HOME, '.openclaw', 'openclaw.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config not found at ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const token = config.channels?.discord?.token;
    
    if (!token) {
      throw new Error('Discord token not found in config');
    }

    return token;
  } catch (err) {
    console.error('Failed to load Discord token:', err.message);
    process.exit(1);
  }
}

function fetchLatestMessage(channelId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'discord.com',
      path: `/api/v10/channels/${channelId}/messages?limit=5`,
      method: 'GET',
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

function sendDM(userId, content) {
  return new Promise((resolve, reject) => {
    // Step 1: Create DM channel
    const createDMOptions = {
      hostname: 'discord.com',
      path: '/api/v10/users/@me/channels',
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const createDMReq = https.request(createDMOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const dmChannel = JSON.parse(data);
          // Step 2: Send message
          const sendMsgOptions = {
            hostname: 'discord.com',
            path: `/api/v10/channels/${dmChannel.id}/messages`,
            method: 'POST',
            headers: {
              'Authorization': `Bot ${DISCORD_TOKEN}`,
              'Content-Type': 'application/json'
            }
          };

          const sendMsgReq = https.request(sendMsgOptions, (msgRes) => {
            let msgData = '';
            msgRes.on('data', chunk => msgData += chunk);
            msgRes.on('end', () => {
              if (msgRes.statusCode === 200) {
                resolve(JSON.parse(msgData));
              } else {
                reject(new Error(`Failed to send DM: HTTP ${msgRes.statusCode}`));
              }
            });
          });

          sendMsgReq.write(JSON.stringify({ content }));
          sendMsgReq.end();
        } else {
          reject(new Error(`Failed to create DM: HTTP ${res.statusCode}`));
        }
      });
    });

    createDMReq.write(JSON.stringify({ recipient_id: userId }));
    createDMReq.end();
  });
}

async function main() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  console.log(`[${new Date().toISOString()}] Checking news for ${todayStr}...`);

  try {
    const messages = await fetchLatestMessage(NEWS_CHANNEL_ID);
    
    // 今日の日付が含まれるメッセージを探す
    const foundToday = messages.some(msg => msg.content.includes(todayStr));

    if (foundToday) {
      console.log('✅ News found for today. All good.');
      process.exit(0);
    } else {
      console.log('⚠️ News NOT found for today. Sending alert to かっぴー...');
      await sendDM(KAPPY_USER_ID, `⚠️ 朝8:00のAI・ECニュースがまだ配信されてないぜ。\n\n確認日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);
      console.log('✅ Alert sent.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
