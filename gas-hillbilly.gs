/**
 * ヒルビリーキャンプ場 予約監視
 */

const HILLBILLY_BASE_URL = 'https://book.checkinn.jp/3363ad7c801d24ca8c8e3679d640b28c8cd7b56129408330d754bec0315b9df2';

// 2026年の月曜祝日（日曜宿泊OK）
const MONDAY_HOLIDAYS_2026 = ['1/12', '2/23', '5/4', '7/20', '9/21', '10/12', '11/23'];

/**
 * メイン関数
 */
function checkHillbillyAvailability() {
  const today = new Date();
  const results = [];
  
  // 当月から先3ヶ月（計4ヶ月）チェック
  for (let i = 0; i < 4; i++) {
    const checkDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;
    
    Logger.log(`チェック中: ${monthStr}`);
    
    const available = fetchHillbillyMonth(monthStr);
    if (available.length > 0) {
      results.push({
        month: `${month}月`,
        slots: available
      });
    }
  }
  
  // 空きがあれば通知
  if (results.length > 0) {
    sendHillbillyNotification(results);
  } else {
    Logger.log('ヒルビリー：空きなし。通知スキップ。');
  }
}

/**
 * 指定月の予約状況を取得
 */
function fetchHillbillyMonth(monthStr) {
  const url = `${HILLBILLY_BASE_URL}?month=${monthStr}`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const html = response.getContentText();
    return parseHillbillyAvailability(html, monthStr);
  } catch (error) {
    Logger.log(`ヒルビリーエラー (${monthStr}): ${error}`);
    return [];
  }
}

/**
 * HTMLから空き状況を抽出
 */
function parseHillbillyAvailability(html, monthStr) {
  const available = [];
  const [year, month] = monthStr.split('-').map(Number);
  
  // 簡易パース：日付と状態を抽出
  const pattern = /<div[^>]*>(\d+)<\/div>[\s\S]*?<div[^>]*>(残室あり|残りわずか)<\/div>/g;
  let match;
  
  while ((match = pattern.exec(html)) !== null) {
    const day = parseInt(match[1], 10);
    const status = match[2];
    const dateStr = `${month}/${day}`;
    
    // その日の曜日を計算
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0=日, 6=土
    
    // 土曜 or 三連休の日曜のみ
    if (dayOfWeek === 6) {
      // 土曜は常にOK
      available.push({
        date: dateStr,
        day: getDayName(dayOfWeek),
        status: status
      });
    } else if (dayOfWeek === 0) {
      // 日曜：翌月曜が祝日かチェック
      const nextDay = day + 1;
      const nextDateStr = `${month}/${nextDay}`;
      
      if (MONDAY_HOLIDAYS_2026.includes(nextDateStr)) {
        available.push({
          date: dateStr,
          day: getDayName(dayOfWeek),
          status: status
        });
      }
    }
  }
  
  return available;
}

/**
 * 曜日名取得
 */
function getDayName(dayOfWeek) {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayOfWeek];
}

/**
 * Discord通知送信
 */
function sendHillbillyNotification(results) {
  let content = '🏕️ **ヒルビリーキャンプ場に空きが出たぜ！**\n\n';
  
  results.forEach(monthData => {
    content += `**【${monthData.month}】**\n`;
    monthData.slots.forEach(slot => {
      const emoji = slot.status === '残室あり' ? '✅' : '⚠️';
      content += `${emoji} ${slot.date}(${slot.day}) - ${slot.status}\n`;
    });
    content += '\n';
  });
  
  content += `🔗 予約はこちら: ${HILLBILLY_BASE_URL}`;
  
  const payload = {
    content: content,
    username: 'ヒルビリー監視bot'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('ヒルビリー：Discord通知送信成功');
  } catch (error) {
    Logger.log(`ヒルビリー：Discord通知エラー: ${error}`);
  }
}
