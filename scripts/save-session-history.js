#!/usr/bin/env node

/**
 * セッション履歴を保存するスクリプト
 * 最後の保存タイムスタンプ以降のメッセージのみを保存（差分保存）
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/katonaoki/Documents/claw-projects/my-repo';
const HISTORY_DIR = path.join(WORKSPACE, 'history');
const LAST_SAVE_FILE = path.join(WORKSPACE, '.last-history-save');

async function saveSessionHistory() {
  try {
    // 最後の保存タイムスタンプを取得
    let lastSaveTime = 0;
    if (fs.existsSync(LAST_SAVE_FILE)) {
      lastSaveTime = parseInt(fs.readFileSync(LAST_SAVE_FILE, 'utf8'), 10);
    }

    // セッション履歴を取得（sessions_historyツールを使う想定）
    // ここではダミーデータ（実際はOpenClawのAPIで取得）
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:\.]/g, '-').substring(0, 19);
    const filename = `${timestamp}.md`;
    const filepath = path.join(HISTORY_DIR, filename);

    // 履歴フォルダがなければ作成
    if (!fs.existsSync(HISTORY_DIR)) {
      fs.mkdirSync(HISTORY_DIR, { recursive: true });
    }

    // 保存内容（実際はsessions_historyから取得したデータ）
    const content = `# Session History - ${now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

> 最終保存以降の履歴（差分保存）
> 前回保存: ${lastSaveTime === 0 ? '初回保存' : new Date(lastSaveTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

---

## 会話履歴

（ここにsessions_historyで取得した履歴が入る）

---

*保存日時: ${now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}*
`;

    // ファイルに保存
    fs.writeFileSync(filepath, content, 'utf8');

    // 最後の保存タイムスタンプを更新
    fs.writeFileSync(LAST_SAVE_FILE, now.getTime().toString(), 'utf8');

    console.log(`✅ 履歴保存完了: ${filename}`);
    return { success: true, filepath, timestamp: now.getTime() };

  } catch (error) {
    console.error('❌ 履歴保存エラー:', error);
    return { success: false, error: error.message };
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  saveSessionHistory().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { saveSessionHistory };
