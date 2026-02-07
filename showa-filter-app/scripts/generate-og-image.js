const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateOGImage() {
  const width = 1200;
  const height = 630;
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Before/After画像を読み込んでリサイズ
  const beforePath = path.join(publicDir, 'samples', 'before.jpg');
  const afterPath = path.join(publicDir, 'samples', 'after.jpg');
  
  // 画像のサイズ（左右に配置）
  const imageWidth = 350;
  const imageHeight = 260;
  
  // Before画像をリサイズ
  const beforeBuffer = await sharp(beforePath)
    .resize(imageWidth, imageHeight, { fit: 'cover' })
    .toBuffer();
  
  // After画像をリサイズ
  const afterBuffer = await sharp(afterPath)
    .resize(imageWidth, imageHeight, { fit: 'cover' })
    .toBuffer();

  // ベース画像を作成（昭和風の背景色）
  const baseImage = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 139, g: 69, b: 19, alpha: 1 } // #8B4513
    }
  });

  // SVGでテキストオーバーレイを作成
  const textOverlay = `
    <svg width="${width}" height="${height}">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700');
          .title { font-family: 'Shippori Mincho', serif; font-weight: 700; }
          .catchphrase { font-family: 'Shippori Mincho', serif; }
        </style>
      </defs>
      
      <!-- 背景グラデーション -->
      <rect width="${width}" height="${height}" fill="#8B4513"/>
      
      <!-- 上部の装飾ライン -->
      <rect x="0" y="0" width="${width}" height="8" fill="#FFD700"/>
      <rect x="0" y="${height - 8}" width="${width}" height="8" fill="#FFD700"/>
      
      <!-- 左のBefore枠 -->
      <rect x="48" y="170" width="${imageWidth + 8}" height="${imageHeight + 8}" fill="#3E2723"/>
      
      <!-- 右のAfter枠 -->
      <rect x="${width - imageWidth - 56}" y="170" width="${imageWidth + 8}" height="${imageHeight + 8}" fill="#5D4037"/>
      
      <!-- 中央のコンテンツエリア -->
      <rect x="${(width - 360) / 2}" y="80" width="360" height="470" fill="#FFFEF0" rx="8"/>
      
      <!-- タイトル -->
      <text x="${width / 2}" y="160" text-anchor="middle" class="title" fill="#8B4513" font-size="42" font-weight="bold">昭和Pictures</text>
      
      <!-- キャッチコピー -->
      <text x="${width / 2}" y="210" text-anchor="middle" class="catchphrase" fill="#5D4037" font-size="18">最新の写真が、</text>
      <text x="${width / 2}" y="235" text-anchor="middle" class="catchphrase" fill="#5D4037" font-size="18">最古の思い出に。</text>
      
      <!-- Before/Afterラベル -->
      <rect x="48" y="440" width="80" height="30" fill="#FFD700"/>
      <text x="88" y="462" text-anchor="middle" fill="#3E2723" font-size="16" font-weight="bold">現代</text>
      
      <rect x="${width - imageWidth - 56}" y="440" width="80" height="30" fill="#8B4513"/>
      <text x="${width - imageWidth - 16}" y="462" text-anchor="middle" fill="#FFFEF0" font-size="16" font-weight="bold">昭和</text>
      
      <!-- 矢印 -->
      <text x="${width / 2}" y="320" text-anchor="middle" fill="#8B4513" font-size="48">⏰</text>
      <text x="${width / 2}" y="370" text-anchor="middle" fill="#5D4037" font-size="14">時を超える</text>
      
      <!-- 3つの時代 -->
      <text x="${width / 2}" y="420" text-anchor="middle" fill="#8B4513" font-size="14" font-weight="bold">明治 × 大正 × 昭和</text>
      
      <!-- 下部のCTA -->
      <rect x="${(width - 200) / 2}" y="470" width="200" height="40" fill="#D2691E" rx="20"/>
      <text x="${width / 2}" y="498" text-anchor="middle" fill="#FFFEF0" font-size="16" font-weight="bold">無料で試す →</text>
      
      <!-- URL -->
      <text x="${width / 2}" y="560" text-anchor="middle" fill="#D2B48C" font-size="12">showa-filter-app.vercel.app</text>
    </svg>
  `;

  // 最終画像を合成
  const finalImage = await baseImage
    .composite([
      // SVGオーバーレイ
      {
        input: Buffer.from(textOverlay),
        top: 0,
        left: 0,
      },
      // Before画像
      {
        input: beforeBuffer,
        top: 174,
        left: 52,
      },
      // After画像
      {
        input: afterBuffer,
        top: 174,
        left: width - imageWidth - 52,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  // 保存
  const outputPath = path.join(publicDir, 'og-image.jpg');
  fs.writeFileSync(outputPath, finalImage);
  console.log('OG image generated:', outputPath);
}

generateOGImage().catch(console.error);
