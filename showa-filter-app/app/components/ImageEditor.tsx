'use client';

import { useState, useRef, useEffect } from 'react';
// heic2anyは動的インポートで使用

type OutputSize = {
  name: string;
  width: number;
  height: number;
};

type FilterEra = 'showa' | 'taisho' | 'meiji';

const FILTER_ERAS: { id: FilterEra; name: string; description: string }[] = [
  { id: 'showa', name: '昭和', description: 'ポラロイド風・暖かい色調' },
  { id: 'taisho', name: '大正', description: 'セピア調・レトロモダン' },
  { id: 'meiji', name: '明治', description: '完全モノクロ・古写真風' },
];

const OUTPUT_SIZES: OutputSize[] = [
  { name: 'オリジナルサイズ', width: 0, height: 0 },
  { name: 'Instagram 正方形（1080x1080）', width: 1080, height: 1080 },
  { name: 'Instagram 縦長（1080x1350）', width: 1080, height: 1350 },
  { name: 'Twitter（1200x675）', width: 1200, height: 675 },
  { name: 'Facebook（1200x630）', width: 1200, height: 630 },
  { name: 'YouTube サムネイル（1280x720）', width: 1280, height: 720 },
];

import { supabase } from '@/lib/supabase';

interface ImageEditorProps {
  user: any;
  credits: number;
  plan: 'free' | 'light' | 'pro';
  onCreditsUpdate: (userId: string) => Promise<void>;
  onOpenAuthModal: () => void;
}

export default function ImageEditor({ user, credits, plan, onCreditsUpdate, onOpenAuthModal }: ImageEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<OutputSize>(OUTPUT_SIZES[0]);
  const [selectedEra, setSelectedEra] = useState<FilterEra>('showa');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // ファイル選択ハンドラ
  const handleFileSelect = async (file: File) => {
    // HEICファイルの場合はサーバーサイドで変換
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                   file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    
    if (isHeic) {
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert-heic', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'HEIC変換に失敗しました');
        }

        // 変換されたDataURLで画像を読み込む
        const img = new Image();
        img.onload = () => {
          setOriginalImage(img);
          setPreviewUrl(null);
          setSelectedFile(file);
          setIsProcessing(false);
        };
        img.onerror = () => {
          alert('画像の読み込みに失敗しました');
          setIsProcessing(false);
        };
        img.src = result.dataUrl;
        return;
      } catch (error: any) {
        console.error('HEIC変換エラー:', error);
        alert(error.message || 'HEICファイルの変換に失敗しました。JPEGまたはPNG形式でお試しください。');
        setIsProcessing(false);
        return;
      }
    }

    // 通常の画像ファイル
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setPreviewUrl(null); // プレビューをリセット
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ドラッグ&ドロップハンドラ
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // フィルター適用
  const applyFilter = async () => {
    if (!originalImage) {
      alert('画像を選択してください');
      return;
    }

    setIsProcessing(true);

    // 少し待ってからprocessing（UIフィードバック）
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // プレビュー用の低解像度サイズ（600x450固定）
    canvas.width = 600;
    canvas.height = 450;

    // 画像を描画（アスペクト比を保ちながらフィット）
    const scale = Math.min(canvas.width / originalImage.width, canvas.height / originalImage.height);
    const x = (canvas.width - originalImage.width * scale) / 2;
    const y = (canvas.height - originalImage.height * scale) / 2;

    ctx.drawImage(originalImage, x, y, originalImage.width * scale, originalImage.height * scale);

    // 時代別フィルター適用
    applyEraFilter(ctx, canvas.width, canvas.height, selectedEra);

    // 透かしを追加
    addWatermark(ctx, canvas.width, canvas.height);

    // プレビューURLを設定
    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
    setIsProcessing(false);
  };

  // 時代別フィルター処理
  const applyEraFilter = (ctx: CanvasRenderingContext2D, width: number, height: number, era: FilterEra) => {
    switch (era) {
      case 'meiji':
        applyMeijiFilter(ctx, width, height);
        break;
      case 'taisho':
        applyTaishoFilter(ctx, width, height);
        break;
      case 'showa':
      default:
        applyShowaFilter(ctx, width, height);
        break;
    }
  };

  // 明治時代フィルター（完全モノクロ・古写真風）
  const applyMeijiFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 完全モノクロ変換
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // 高コントラスト
      let adjusted = (gray - 128) * 1.3 + 128;
      adjusted = Math.min(255, Math.max(0, adjusted));

      data[i] = adjusted;
      data[i + 1] = adjusted;
      data[i + 2] = adjusted;
    }

    ctx.putImageData(imageData, 0, 0);

    // 古い写真の傷・汚れ
    for (let i = 0; i < width * height * 0.02; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const size = Math.random() * 3 + 1;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
      ctx.fillRect(x, y, size, size);
    }

    // 縦線ノイズ（古いフィルムの傷）
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * width);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + Math.random() * 10 - 5, height);
      ctx.stroke();
    }

    // 強いビネット
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.15, width / 2, height / 2, width * 0.7);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.5, 'rgba(0,0,0,0.2)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 古い紙の色味オーバーレイ
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(180, 160, 140, 0.15)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  // 大正時代フィルター（セピア調・レトロモダン）
  const applyTaishoFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 彩度を大きく下げる
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = r * 0.4 + gray * 0.6;
      g = g * 0.4 + gray * 0.6;
      b = b * 0.4 + gray * 0.6;

      // セピア調に変換
      const newR = r * 1.1 + 30;
      const newG = g * 0.95 + 15;
      const newB = b * 0.7 - 10;
      r = Math.min(255, Math.max(0, newR));
      g = Math.min(255, Math.max(0, newG));
      b = Math.min(255, Math.max(0, newB));

      // コントラストを少し下げる
      const contrast = 0.9;
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);

    // フィルムグレイン
    for (let i = 0; i < width * height * 0.08; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const brightness = Math.random() * 80 - 40;
      ctx.fillStyle = `rgba(${140 + brightness}, ${120 + brightness}, ${90 + brightness}, 0.15)`;
      ctx.fillRect(x, y, 1, 1);
    }

    // ビネット（中程度）
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.6, 'rgba(0,0,0,0.1)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // セピアオーバーレイ
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(160, 130, 90, 0.2)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  // 昭和時代フィルター（ポラロイド風）
  const applyShowaFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. 彩度を少しだけ下げる（ポラロイドは色が残る）
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = r * 0.7 + gray * 0.3;
      g = g * 0.7 + gray * 0.3;
      b = b * 0.7 + gray * 0.3;

      // 2. ポラロイド風の色調整（暖かみ + シャドウに青緑）
      // 明るい部分は暖かく、暗い部分は少し青緑がかる
      const luminance = (r + g + b) / 3;
      const warmth = luminance / 255; // 0-1（明るいほど暖かく）
      
      // 暖色シフト（ハイライト）
      r = r + 25 * warmth;
      g = g + 10 * warmth;
      b = b - 15 * warmth;
      
      // 青緑シフト（シャドウ）
      const coolness = 1 - warmth;
      r = r - 10 * coolness;
      g = g + 5 * coolness;
      b = b + 15 * coolness;

      // 3. コントラストを少し下げる（ふんわり感）
      const contrast = 0.9;
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;

      // 4. 全体的に少し明るく、フェード感
      r = Math.min(255, Math.max(0, r + 10));
      g = Math.min(255, Math.max(0, g + 8));
      b = Math.min(255, Math.max(0, b + 5));

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);

    // 5. 軽めのフィルムグレイン（ポラロイドは粒子が細かい）
    for (let i = 0; i < width * height * 0.05; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const brightness = Math.random() * 60 - 30;
      ctx.fillStyle = `rgba(${128 + brightness}, ${128 + brightness}, ${128 + brightness}, 0.1)`;
      ctx.fillRect(x, y, 1, 1);
    }

    // 6. 軽いライトリーク（ポラロイド風、オレンジ〜黄色）
    const lightLeakGradient = ctx.createLinearGradient(0, 0, width * 0.4, height * 0.4);
    lightLeakGradient.addColorStop(0, 'rgba(255, 200, 100, 0.12)');
    lightLeakGradient.addColorStop(0.5, 'rgba(255, 180, 80, 0.06)');
    lightLeakGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = lightLeakGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    // 7. 軽めのビネット（ポラロイドは周辺減光が控えめ）
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.7, 'rgba(0,0,0,0.05)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 8. クリーム色のオーバーレイ（ポラロイドの紙の色味）
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 250, 230, 0.15)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  // 透かし追加
  const addWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';

    for (let y = 50; y < height; y += 100) {
      for (let x = 50; x < width; x += 150) {
        ctx.fillText('SAMPLE', x, y);
      }
    }

    ctx.restore();
  };

  // ダウンロード
  const handleDownload = async () => {
    if (!originalImage || !previewUrl) {
      alert('先にフィルターを適用してください');
      return;
    }

    // ログインチェック（ダウンロード時のみ必要）
    if (!user) {
      onOpenAuthModal();
      return;
    }

    // クレジットチェック
    if (plan !== 'pro' && credits <= 0) {
      alert('クレジットが不足しています。プランをアップグレードしてください。');
      return;
    }

    // クレジット消費処理
    if (plan !== 'pro') {
      const { error } = await supabase
        .from('subscriptions')
        .update({ credits: credits - 1, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        alert('エラーが発生しました: ' + error.message);
        return;
      }

      // クレジット更新
      await onCreditsUpdate(user.id);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 出力サイズを決定
    if (selectedSize.width === 0) {
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
    } else {
      canvas.width = selectedSize.width;
      canvas.height = selectedSize.height;
    }

    // 画像を描画（アスペクト比を保ちながらフィット）
    const scale = Math.min(canvas.width / originalImage.width, canvas.height / originalImage.height);
    const x = (canvas.width - originalImage.width * scale) / 2;
    const y = (canvas.height - originalImage.height * scale) / 2;

    ctx.drawImage(originalImage, x, y, originalImage.width * scale, originalImage.height * scale);

    // 時代別フィルター適用（透かしなし）
    applyEraFilter(ctx, canvas.width, canvas.height, selectedEra);

    // iOS判定
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // iOSの場合はShare APIを使用
    if (isIOS && navigator.share) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const filename = `showa-filter-${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });

        try {
          await navigator.share({
            files: [file],
            title: '昭和Pictures',
          });

          // ダウンロード履歴を記録
          await supabase.from('download_history').insert({
            user_id: user.id,
          });

          // 成功メッセージは表示しない（共有画面が表示されるため）
        } catch (error: any) {
          // ユーザーがキャンセルした場合はエラー表示しない
          if (error.name !== 'AbortError') {
            console.error('Share failed:', error);
            alert('共有に失敗しました。ブラウザを最新版に更新してください。');
          }
        }
      }, 'image/jpeg', 0.95);
      return;
    }

    // 通常のダウンロード（PC・Android）
    canvas.toBlob(async (blob) => {
      if (blob) {
        const filename = `showa-filter-${Date.now()}.jpg`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        // ダウンロード履歴を記録
        await supabase.from('download_history').insert({
          user_id: user.id,
        });

        if (plan === 'pro') {
          alert('ダウンロードしました！');
        } else {
          alert(`ダウンロードしました！（残りクレジット: ${credits - 1}枚）`);
        }
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn px-2 md:px-0">
      <h2 className="text-xl md:text-4xl text-[#8B7355] mb-4 md:mb-8 font-light tracking-wide md:tracking-wider">写真を加工する</h2>

      {/* アップロードエリア */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-4 border-dashed border-[#8B7355] rounded-xl p-8 md:p-16 text-center bg-white/50 hover:bg-white/70 transition-all cursor-pointer mb-6 md:mb-8"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        <div className="text-6xl mb-4">📷</div>
        <p className="text-xl text-[#5D4037] mb-2">
          <strong>{selectedFile ? selectedFile.name : 'ここをクリック'}</strong>{' '}
          {!selectedFile && 'または ドラッグ&ドロップ'}
        </p>
        <p className="text-sm text-[#8B7355]">JPEG・PNG・WebP対応</p>
      </div>

      {/* プレビューエリア */}
      {originalImage && (
        <div className="mb-8">
          <h3 className="text-xl md:text-2xl text-[#8B7355] mb-4">プレビュー</h3>
          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <p className="mb-2 text-xs md:text-sm font-semibold text-[#5D4037] h-8 md:h-6 flex items-end">元画像</p>
              <img
                src={originalImage.src}
                alt="Original"
                className="w-full border-4 border-[#8B7355] rounded shadow-lg"
              />
            </div>
            {previewUrl && (
              <div>
                <p className="mb-2 text-xs md:text-sm font-semibold text-[#5D4037] h-8 md:h-6 flex items-end">変換後</p>
                <canvas
                  ref={previewCanvasRef}
                  className="w-full border-4 border-[#D2691E] rounded shadow-lg"
                  style={{ display: 'none' }}
                />
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full border-4 border-[#D2691E] rounded shadow-lg"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 時代選択 */}
      <div className="mb-6">
        <label className="block text-base md:text-lg font-semibold text-[#5D4037] mb-2">📅 時代を選択</label>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {FILTER_ERAS.map((era) => (
            <button
              key={era.id}
              onClick={() => {
                setSelectedEra(era.id);
                setPreviewUrl(null); // プレビューリセット
              }}
              className={`p-2 md:p-4 rounded-lg border-2 md:border-4 transition-all ${
                selectedEra === era.id
                  ? 'border-[#D2691E] bg-[#D2691E]/10 shadow-lg'
                  : 'border-[#8B7355] bg-white hover:border-[#D2691E]'
              }`}
            >
              <p className="text-lg md:text-2xl font-bold text-[#5D4037]">{era.name}</p>
              <p className="text-[10px] md:text-xs text-[#8B7355] mt-1 leading-tight">{era.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* サイズ選択 */}
      <div className="mb-6 md:mb-8">
        <label className="block text-base md:text-lg font-semibold text-[#5D4037] mb-2">📐 出力サイズを選択</label>
        <select
          value={selectedSize.name}
          onChange={(e) => {
            const size = OUTPUT_SIZES.find((s) => s.name === e.target.value);
            if (size) setSelectedSize(size);
          }}
          className="w-full p-4 text-base border-2 border-[#8B7355] rounded-lg bg-white text-[#3E2723] cursor-pointer"
        >
          {OUTPUT_SIZES.map((size) => (
            <option key={size.name} value={size.name}>
              {size.name}
            </option>
          ))}
        </select>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2 md:gap-4">
        <button
          onClick={applyFilter}
          disabled={!originalImage || isProcessing}
          className={`flex-1 py-4 text-lg font-semibold text-white rounded-lg transition-all shadow-lg ${
            originalImage && !isProcessing
              ? 'bg-gradient-to-r from-[#D2691E] to-[#A0522D] hover:-translate-y-1 active:scale-95'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? '処理中...' : '⏰ タイムスリップ！'}
        </button>
        <button
          onClick={handleDownload}
          disabled={!previewUrl}
          className={`flex-1 py-4 text-lg font-semibold text-white rounded-lg transition-all shadow-lg ${
            previewUrl
              ? 'bg-[#8B7355] hover:-translate-y-1 hover:bg-[#A0522D] active:scale-95'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          📥 ダウンロード
        </button>
      </div>

      <p className="mt-8 text-[#8B7355] text-sm">※ダウンロード時にクレジットを1枚消費します</p>
    </div>
  );
}
