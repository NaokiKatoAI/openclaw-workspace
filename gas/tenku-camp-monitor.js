/**
 * TENKU CAMP BASE 奥武蔵 予約監視 for Google Apps Script
 * 
 * 使い方：
 * 1. Google Apps Script で新規プロジェクト作成（ヒルビリーと同じプロジェクトでOK）
 * 2. このコードを新しいファイルとして追加
 * 3. トリガー設定：checkTenkuAvailability を 30分おき or 1時間おきで実行
 */

const TENKU_WEBHOOK_URL = 'https://discord.com/api/webhooks/1468154343789428827/Tr3kepGXLPvuRWJZ2mVOgg20o0apI1WRJq_8f8ALv3WOC_0g64zStDkSGEmAk9xAnAOY';
const TENKU_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdBIcoPt3q09247hYpemaYdPdzm-86SsP_ytbQLD7EhxU7isA/viewform';

// 2026年の月曜祝日（日曜宿泊OK）
const MONDAY_HOLIDAYS_2026 = ['1/12', '2/23', '5/4', '7/20', '9/21', '10/12', '11/23'];

/**
 * メイン関数
 */
function checkTenkuAvailability() {
  Logger.log('=== TENKU CAMP チェック開始 ===');
  
  try {
    const response = UrlFetchApp.fetch(TENKU_FORM_URL, {
      muteHttpExceptions: true
    });
    
    const html = response.getContentText();
    const available = parseTenkuAvailability(html);
    
    if (available.length > 0) {
      sendTenkuNotification(available);
      Logger.log(`空きあり: ${available.length}件`);
    } else {
      Logger.log('空きなし。通知スキップ。');
    }
    
  } catch (error) {
    Logger.log(`エラー: ${error}`);
  }
}

/**
 * HTMLから空き状況を抽出
 */
function parseTenkuAvailability(html) {
  const available = [];
  
  // 営業日の行を抽出
  // パターン: "2/6 〇（天S極✕,新天S極✕,新天L極✕）"
  const datePattern = /(\d+)\/(\d+)\s+(〇|残\d+)/g;
  let match;
  
  while ((match = datePattern.exec(html)) !== null) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const status = match[3];
    
    // 日付オブジェクト作成
    const date = new Date(2026, month - 1, day);
    const dayOfWeek = date.getDay(); // 0=日, 6=土
    
    // 土曜 or 三連休の日曜のみ
    let isTarget = false;
    if (dayOfWeek === 6) {
      // 土曜は常にOK
      isTarget = true;
    } else if (dayOfWeek === 0) {
      // 日曜：翌月曜が祝日かチェック
      const nextDay = day + 1;
      const nextDateStr = `${month}/${nextDay}`;
      if (MONDAY_HOLIDAYS_2026.includes(nextDateStr)) {
        isTarget = true;
      }
    }
    
    if (isTarget) {
      available.push({
        date: `${month}/${day}`,
        day: getDayName(dayOfWeek),
        status: status
      });
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
function sendTenkuNotification(available) {
  let content = '⛰️ **TENKU CAMP BASE 奥武蔵に空きが出たぜ！**\n\n';
  
  // 月ごとにグループ化
  const grouped = {};
  available.forEach(slot => {
    const month = slot.date.split('/')[0] + '月';
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(slot);
  });
  
  Object.entries(grouped).forEach(([month, slots]) => {
    content += `**【${month}】**\n`;
    slots.forEach(slot => {
      const emoji = slot.status === '〇' ? '✅' : '⚠️';
      content += `${emoji} ${slot.date}(${slot.day}) - ${slot.status}\n`;
    });
    content += '\n';
  });
  
  content += `🔗 予約はこちら: ${TENKU_FORM_URL}`;
  
  const payload = {
    content: content,
    username: 'TENKU CAMP監視bot'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(TENKU_WEBHOOK_URL, options);
    Logger.log('Discord通知送信成功');
  } catch (error) {
    Logger.log(`Discord通知エラー: ${error}`);
  }
}

/**
 * テスト実行用（手動実行で確認）
 */
function testTenkuRun() {
  Logger.log('=== TENKU CAMP テスト実行 ===');
  checkTenkuAvailability();
}
