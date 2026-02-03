#!/usr/bin/env node
/**
 * 浩庵キャンプ場の予約状況チェック
 * 今月・来月の土日で空いてる枠を検出
 */

const puppeteer = require('puppeteer');

const URL = 'https://kouan-motosuko.com/reserve/Reserve/input/?type=camp';

// 2026年の月曜祝日（日曜宿泊OK）
const MONDAY_HOLIDAYS_2026 = ['1/12', '2/23', '5/4', '7/20', '9/21', '10/12', '11/23'];

/**
 * 日付が土曜または三連休の日曜かチェック
 */
function isTargetDate(dateText) {
  // 土曜は常にOK
  if (dateText.includes('土')) return true;
  
  // 日曜で翌月曜が祝日ならOK
  if (dateText.includes('日')) {
    // "2/22 日" のような形式から日付部分を抽出
    const match = dateText.match(/(\d+)\/(\d+)/);
    if (!match) return false;
    
    const [month, day] = match[1].split('/').map(Number);
    
    // 翌日（月曜）が祝日かチェック
    const nextDay = day + 1;
    const nextDateStr = `${month}/${nextDay}`;
    
    return MONDAY_HOLIDAYS_2026.includes(nextDateStr);
  }
  
  return false;
}

async function checkAvailability() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // カレンダーが描画されるまで待つ
    await page.waitForSelector('table', { timeout: 10000 });
    
    // 予約状況を取得
    const availability = await page.evaluate(() => {
      const results = [];
      
      // カレンダーのテーブルを探す
      const tables = Array.from(document.querySelectorAll('table'));
      
      tables.forEach(table => {
        const rows = Array.from(table.querySelectorAll('tr'));
        
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          
          cells.forEach(cell => {
            // 日付が含まれているセルを探す
            const dateText = cell.textContent.trim();
            const dateMatch = dateText.match(/(\d+)/);
            
            if (!dateMatch) return;
            
            // 曜日を判定（土日のみ）
            const dayMatch = cell.textContent.match(/(土|日)/);
            if (!dayMatch) return;
            
            // 予約可能かチェック（"割増～"や"通常～"があれば予約可能）
            const hasAvailability = cell.textContent.includes('割増') || 
                                   cell.textContent.includes('通常') ||
                                   !cell.textContent.includes('満');
            
            if (hasAvailability) {
              results.push({
                date: dateText,
                available: true
              });
            }
          });
        });
      });
      
      return results;
    });
    
    await browser.close();
    
    // 土曜 or 三連休の日曜でフィルタ
    const filtered = availability.filter(slot => isTargetDate(slot.date));
    
    return filtered;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function main() {
  try {
    console.log('🏕️ 浩庵キャンプ場の予約状況をチェック中...\n');
    
    const available = await checkAvailability();
    
    if (available.length === 0) {
      // 空きがなければ何も出力しない（静かにする）
      return;
    }
    
    // 出力
    console.log('✅ **浩庵キャンプ場で空いてる日（土曜・三連休の日曜）**\n');
    available.forEach(slot => {
      console.log(`- ${slot.date}`);
    });
    
  } catch (error) {
    console.error('❌ エラーが発生したぜ:', error.message);
    process.exit(1);
  }
}

main();
