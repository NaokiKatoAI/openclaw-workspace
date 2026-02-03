#!/usr/bin/env node
/**
 * ふもとっぱらキャンプ場の予約状況チェック
 * 今月・来月の土日で空いてる枠を検出
 */

const puppeteer = require('puppeteer');

const URL = 'https://reserve.fumotoppara.net/reserved/reserved-calendar-list';

// 2026年の月曜祝日（日曜宿泊OK）
const MONDAY_HOLIDAYS_2026 = [
  '1/12', '2/23', '5/4', '7/20', '9/21', '10/12', '11/23'
];

/**
 * 日付が土曜または三連休の日曜かチェック
 */
function isTargetDate(dateText) {
  // 土曜は常にOK
  if (dateText.includes('土')) return true;
  
  // 日曜で翌月曜が祝日ならOK
  if (dateText.includes('日')) {
    // "2/22 日" のような形式から日付部分を抽出
    const match = dateText.match(/(\d+\/\d+)/);
    if (!match) return false;
    
    const [month, day] = match[1].split('/').map(Number);
    
    // 翌日（月曜）が祝日かチェック
    const nextDay = day + 1;
    const nextDateStr = `${month}/${nextDay}`;
    
    return MONDAY_HOLIDAYS_2026.includes(nextDateStr);
  }
  
  return false;
}

/**
 * 月が冬の雪シーズン（12-3月）かチェック
 */
function isWinterSeason(dateText) {
  const match = dateText.match(/(\d+)\/\d+/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  return month === 12 || month === 1 || month === 2 || month === 3;
}

/**
 * 施設がチェック対象か判定
 */
function isTargetFacility(facilityName, dateText) {
  // キャンプ宿泊は通年OK
  if (facilityName === 'キャンプ宿泊') return true;
  
  // コテージ類は冬のみ
  const cottages = ['コテージ柏', '翠山荘', '毛無山荘', '金山キャビン', 'コロッケ'];
  if (cottages.includes(facilityName) && isWinterSeason(dateText)) {
    return true;
  }
  
  return false;
}

async function checkAvailability() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 予約状況を取得
    const availability = await page.evaluate(() => {
      const results = [];
      const table = document.querySelector('table');
      if (!table) return results;
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const headers = Array.from(table.querySelectorAll('thead tr th'));
      
      // ヘッダーから日付情報を取得
      const dates = headers.slice(1).map(th => {
        const text = th.textContent.trim();
        return text;
      });
      
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const facilityName = cells[0]?.textContent.trim();
        
        cells.slice(1).forEach((cell, idx) => {
          const status = cell.textContent.trim();
          const dateText = dates[idx];
          
          // 一旦土日すべて取得（後でNode.js側でフィルタ）
          if (dateText && (dateText.includes('土') || dateText.includes('日'))) {
            // 空きあり（〇または△）
            if (status.includes('〇') || status.includes('△')) {
              results.push({
                facility: facilityName,
                date: dateText,
                status: status
              });
            }
          }
        });
      });
      
      return results;
    });
    
    await browser.close();
    return availability;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function main() {
  try {
    console.log('🏕️ ふもとっぱらキャンプ場の予約状況をチェック中...\n');
    
    const available = await checkAvailability();
    
    // 土曜 or 三連休の日曜 & 対象施設でフィルタ
    const filtered = available.filter(slot => 
      isTargetDate(slot.date) && isTargetFacility(slot.facility, slot.date)
    );
    
    if (filtered.length === 0) {
      // 空きがなければ何も出力しない（静かにする）
      return;
    }
    
    // 施設ごとにグループ化
    const grouped = {};
    filtered.forEach(slot => {
      if (!grouped[slot.facility]) {
        grouped[slot.facility] = [];
      }
      grouped[slot.facility].push({ date: slot.date, status: slot.status });
    });
    
    // 出力
    console.log('✅ **空いてる日（土曜・三連休の日曜）**\n');
    Object.entries(grouped).forEach(([facility, slots]) => {
      console.log(`**${facility}**`);
      slots.forEach(slot => {
        console.log(`  - ${slot.date} ${slot.status}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラーが発生したぜ:', error.message);
    process.exit(1);
  }
}

main();
