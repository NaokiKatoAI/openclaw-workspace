/**
 * TENKU CAMP BASE 奥武蔵 予約状況チェッカー
 * M/Lサイト（車が入る）の空き状況をDiscordに通知
 */

const TENKU_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdBIcoPt3q09247hYpemaYdPdzm-86SsP_ytbQLD7EhxU7isA/viewform';

// M/Lサイズで車が入るサイト
const TENKU_TARGET_SITES = ['ラM', 'ラL', 'フM', '天L', '新ラ', '新天L', '新天L極'];

/**
 * メイン処理
 */
function checkTenkuBase() {
  try {
    const html = UrlFetchApp.fetch(TENKU_FORM_URL).getContentText();
    const availability = parseTenkuAvailability(html);
    
    if (availability.length === 0) {
      Logger.log('TENKU BASE：予約状況が取得できませんでした');
      return;
    }
    
    const results = filterTenkuMLSites(availability);
    
    // 前回の結果と比較
    const lastResults = getTenkuLastResults();
    const currentHash = hashTenkuResults(results);
    
    if (currentHash === lastResults) {
      Logger.log('TENKU BASE：前回から変更なし。通知スキップ');
      return;
    }
    
    // 変更があった場合のみ通知＋保存
    if (results.length > 0) {
      sendTenkuToDiscord(results);
      saveTenkuLastResults(currentHash);
    } else {
      Logger.log('TENKU BASE：M/Lサイトの空きがありません');
      saveTenkuLastResults(currentHash);
    }
    
  } catch (e) {
    Logger.log('TENKU BASE エラー: ' + e.message);
    sendTenkuErrorToDiscord(e.message);
  }
}

/**
 * HTMLから予約状況を抽出
 */
function parseTenkuAvailability(html) {
  const availability = [];
  
  // 予約空き状況セクションを探す
  const startMarker = 'ご予約空き状況';
  const endMarker = 'ご予約方法';
  
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker, startIdx);
  
  if (startIdx === -1 || endIdx === -1) {
    Logger.log('TENKU BASE：予約状況セクションが見つかりません');
    return availability;
  }
  
  const section = html.substring(startIdx, endIdx);
  
  // HTML タグを除去してプレーンテキスト化
  const plainText = section.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  
  // 日付パターンで抽出: "2/6 〇（...）" または "2/14 残7（...）" など
  const datePattern = /(\d+\/\d+)\s+([^\d]+?)(?=\d+\/\d+|$)/g;
  let match;
  
  while ((match = datePattern.exec(plainText)) !== null) {
    const date = match[1];
    const status = match[2].trim();
    
    // 有効な状態（〇、残、満）を含む場合のみ追加
    if (status.includes('〇') || status.includes('残') || status.includes('満')) {
      availability.push({
        date: date,
        status: status,
        raw: date + ' ' + status
      });
      
      Logger.log(`パース成功: ${date} - ${status}`);
    }
  }
  
  Logger.log(`TENKU BASE：${availability.length}件の予約情報を取得`);
  return availability;
}

/**
 * M/Lサイトの空き状況をフィルタ
 */
function filterTenkuMLSites(availability) {
  const results = [];
  
  for (const item of availability) {
    const status = item.status;
    
    // "満" は除外
    if (status.includes('満')) {
      continue;
    }
    
    // "〇" の場合、✕のサイトを確認
    if (status.startsWith('〇')) {
      const unavailable = extractTenkuUnavailableSites(status);
      const available = getAvailableTenkuMLSites(unavailable);
      
      if (available.length > 0) {
        results.push({
          date: item.date,
          sites: available,
          note: '全体的に余裕あり'
        });
      }
      continue;
    }
    
    // "残X（...）" の場合、サイトリストから抽出
    if (status.startsWith('残')) {
      const siteMatch = status.match(/残\d+[（(]([^）)]+)[）)]/);
      if (siteMatch) {
        const sites = siteMatch[1].split(',').map(s => s.trim());
        const mlSites = sites.filter(site => {
          return TENKU_TARGET_SITES.some(target => site.includes(target));
        });
        
        if (mlSites.length > 0) {
          results.push({
            date: item.date,
            sites: mlSites,
            note: status.match(/残(\d+)/)[1] + 'サイト空き'
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * ✕のサイトを抽出
 */
function extractTenkuUnavailableSites(status) {
  const unavailable = [];
  const match = status.match(/[（(]([^）)]+)[）)]/);
  
  if (match) {
    const items = match[1].split(',');
    for (const item of items) {
      if (item.includes('✕')) {
        const site = item.replace('✕', '').trim();
        unavailable.push(site);
      }
    }
  }
  
  return unavailable;
}

/**
 * 利用可能なM/Lサイトを取得
 */
function getAvailableTenkuMLSites(unavailable) {
  return TENKU_TARGET_SITES.filter(site => {
    return !unavailable.some(u => u.includes(site));
  });
}

/**
 * Discordに通知
 */
function sendTenkuToDiscord(results) {
  const embed = {
    title: '🏕️ TENKU BASE - M/Lサイト空き情報',
    description: 'M/Lサイズ（車が入る）の空き状況だぜ',
    color: 3447003, // 青色
    fields: [],
    footer: {
      text: '最終チェック: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    }
  };
  
  for (const result of results) {
    embed.fields.push({
      name: `📅 ${result.date} - ${result.note}`,
      value: result.sites.join(', '),
      inline: false
    });
  }
  
  const payload = {
    embeds: [embed]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
  Logger.log('TENKU BASE：Discord通知送信完了');
}

/**
 * エラー通知
 */
function sendTenkuErrorToDiscord(error) {
  const payload = {
    content: '⚠️ TENKU BASE チェッカーでエラーが発生したぜ:\n```' + error + '```'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}

/**
 * 結果をハッシュ化（差分チェック用）
 */
function hashTenkuResults(results) {
  return JSON.stringify(results);
}

/**
 * 前回の結果を取得
 */
function getTenkuLastResults() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('TENKU_LAST_RESULTS') || '';
}

/**
 * 今回の結果を保存
 */
function saveTenkuLastResults(hash) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('TENKU_LAST_RESULTS', hash);
  Logger.log('TENKU BASE：結果を保存しました');
}
