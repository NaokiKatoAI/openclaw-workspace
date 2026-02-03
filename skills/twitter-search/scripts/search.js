#!/usr/bin/env node
/**
 * Twitter検索スクリプト
 * Usage: node search.js <query> [max_results]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 設定ファイルのパス
const SECRETS_PATH = path.join(os.homedir(), '.openclaw', 'twitter-secrets.json');
const COUNTER_PATH = path.join(os.homedir(), '.openclaw', 'twitter-counter.json');

// コマンドライン引数
const query = process.argv[2];
const maxResults = parseInt(process.argv[3]) || 10;

if (!query) {
  console.error('❌ 使い方: node search.js <検索キーワード> [最大件数]');
  process.exit(1);
}

// シークレット読み込み
let secrets;
try {
  secrets = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8'));
} catch (err) {
  console.error('❌ Twitter APIキーが見つかりません:', SECRETS_PATH);
  process.exit(1);
}

// カウンター読み込み/初期化
let counter = { count: 0, resetDate: new Date().toISOString().slice(0, 7) + '-01' };
try {
  counter = JSON.parse(fs.readFileSync(COUNTER_PATH, 'utf8'));
} catch (err) {
  // 初回実行時はファイルがないので新規作成
}

// 月次リセットチェック
const now = new Date();
const resetDate = new Date(counter.resetDate);
if (now >= resetDate) {
  counter.count = 0;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  counter.resetDate = nextMonth.toISOString().slice(0, 10);
}

// 上限チェック
const limit = secrets.monthlyLimit || 10000;
if (counter.count >= limit) {
  console.error(`❌ 月次API上限（${limit}ポスト）に達しました。リセット日: ${counter.resetDate}`);
  process.exit(1);
}

if (counter.count >= limit - 500) {
  console.warn(`⚠️  警告: あと${limit - counter.count}ポストで上限です`);
}

// Twitter API v2 検索
const encodedQuery = encodeURIComponent(query);
const url = `/2/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics&expansions=author_id&user.fields=username,name`;

const options = {
  hostname: 'api.twitter.com',
  path: url,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${secrets.bearerToken}`,
    'User-Agent': 'OpenClaw-Twitter-Search/1.0'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      
      // ユーザー情報をマッピング
      const users = {};
      if (result.includes && result.includes.users) {
        result.includes.users.forEach(u => users[u.id] = u);
      }
      
      // 結果表示
      console.log(`\n🔍 検索結果: "${query}" (${result.meta.result_count}件)\n`);
      
      if (result.data && result.data.length > 0) {
        result.data.forEach((tweet, i) => {
          const user = users[tweet.author_id] || { username: 'unknown', name: 'Unknown' };
          const metrics = tweet.public_metrics;
          console.log(`【${i + 1}】@${user.username} (${user.name})`);
          console.log(`   ${tweet.text}`);
          console.log(`   ❤️ ${metrics.like_count} | 🔁 ${metrics.retweet_count} | 💬 ${metrics.reply_count}`);
          console.log(`   🔗 https://twitter.com/${user.username}/status/${tweet.id}`);
          console.log(`   📅 ${tweet.created_at}\n`);
        });
      } else {
        console.log('該当するポストが見つかりませんでした。');
      }
      
      // カウンター更新
      counter.count += result.meta.result_count;
      fs.writeFileSync(COUNTER_PATH, JSON.stringify(counter, null, 2));
      
      console.log(`📊 今月の使用量: ${counter.count}/${limit}ポスト (次回リセット: ${counter.resetDate})`);
      
    } else {
      console.error(`❌ APIエラー (${res.statusCode}):`, data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ リクエストエラー:', err.message);
  process.exit(1);
});

req.end();
