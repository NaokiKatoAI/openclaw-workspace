import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });
    }

    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // heic-convertで変換
    const heicConvert = (await import('heic-convert')).default;
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9,
    });

    // Base64で返す
    const base64 = Buffer.from(outputBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error: any) {
    console.error('HEIC変換エラー:', error);
    return NextResponse.json(
      { error: `HEIC変換に失敗しました: ${error.message || '不明なエラー'}` },
      { status: 500 }
    );
  }
}
