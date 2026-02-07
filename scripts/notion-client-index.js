#!/usr/bin/env node

/**
 * クライアント別の議事録インデックスを作成
 */

const fs = require('fs');
const path = require('path');

const MINUTES_DIR = '/Users/katonaoki/Documents/claw-projects/my-repo/notion-minutes';
const MAPPING_PATH = '/Users/katonaoki/Documents/claw-projects/my-repo/config/client-notion-mapping.json';
const OUTPUT_DIR = '/Users/katonaoki/Documents/claw-projects/my-repo/notion-minutes-index';

// クライアントマッピング読み込み
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));

// 議事録ファイル一覧取得
const files = fs.readdirSync(MINUTES_DIR).filter(f => f.endsWith('.md'));

// クライアント名リスト
const clientNames = Object.values(mapping.channels).map(c => c.name);

// 出力ディレクトリ作成
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📊 クライアント別議事録インデックス作成中...\n');

// クライアントごとに分類
const clientMinutes = {};

clientNames.forEach(clientName => {
  clientMinutes[clientName] = [];
});

files.forEach(file => {
  const content = fs.readFileSync(path.join(MINUTES_DIR, file), 'utf8');
  
  clientNames.forEach(clientName => {
    // クライアント名の正規化（中黒、スペースを除去して比較）
    const normalizedClientName = clientName.replace(/[・\s]/g, '');
    const normalizedFile = file.replace(/[・\s]/g, '');
    const normalizedContent = content.replace(/[・\s]/g, '');
    
    // ファイル名または内容にクライアント名が含まれているか
    if (normalizedFile.includes(normalizedClientName) || normalizedContent.includes(normalizedClientName)) {
      clientMinutes[clientName].push(file);
    }
  });
});

// 各クライアントのインデックスファイルを作成
Object.entries(clientMinutes).forEach(([clientName, files]) => {
  if (files.length === 0) return;
  
  const indexPath = path.join(OUTPUT_DIR, `${clientName}.md`);
  
  let content = `# ${clientName} 議事録一覧\n\n`;
  content += `**議事録件数**: ${files.length}件\n\n`;
  content += `---\n\n`;
  
  files.sort().forEach(file => {
    const filepath = path.join(MINUTES_DIR, file);
    const minuteContent = fs.readFileSync(filepath, 'utf8');
    
    // タイトルと日付を抽出
    const titleMatch = minuteContent.match(/^# (.+)$/m);
    const dateMatch = minuteContent.match(/\*\*MTG日時\*\*: (.+)$/m);
    const participantsMatch = minuteContent.match(/\*\*参加者\*\*: (.+)$/m);
    
    const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
    const date = dateMatch ? dateMatch[1] : 'no-date';
    const participants = participantsMatch ? participantsMatch[1] : '';
    
    content += `## ${title}\n`;
    content += `- **日時**: ${date}\n`;
    if (participants) {
      content += `- **参加者**: ${participants}\n`;
    }
    content += `- **ファイル**: \`${file}\`\n\n`;
  });
  
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log(`✅ ${clientName}: ${files.length}件`);
});

console.log(`\n📂 インデックス保存先: ${OUTPUT_DIR}`);

// AGENTS.mdへの追記用テキスト生成
const agentsNote = `
## クライアント議事録参照ルール（2026-02-04追加）

**クライアントチャンネルでの質問時:**
1. 該当クライアントの議事録インデックスを確認: \`notion-minutes-index/[クライアント名].md\`
2. 関連する議事録ファイルを参照: \`notion-minutes/YYYY-MM-DD_タイトル.md\`
3. 過去のMTG内容を踏まえて回答

**議事録の場所:**
- 全議事録: \`notion-minutes/\`
- クライアント別インデックス: \`notion-minutes-index/\`
`;

console.log('\n📝 AGENTS.mdに以下を追記してください:');
console.log(agentsNote);
