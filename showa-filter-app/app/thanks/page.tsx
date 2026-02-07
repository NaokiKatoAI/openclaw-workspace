'use client';

import { useRouter } from 'next/navigation';

export default function ThanksPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
      <div className="bg-[#FFFEF0] rounded-xl p-8 md:p-12 max-w-md w-full text-center shadow-2xl border-4 border-[#8B7355]">
        <div className="text-6xl mb-4">📮</div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#8B7355] mb-4">
          お問い合わせ<br />ありがとうございます
        </h1>
        <p className="text-[#5D4037] mb-6">
          メッセージを受け付けました。<br />
          2〜3営業日以内にご返信いたします。
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-[#8B4513] text-[#FFFEF0] font-bold rounded-lg hover:bg-[#A0522D] transition-all"
          style={{boxShadow: '4px 4px 0 #3E2723'}}
        >
          トップに戻る
        </button>
      </div>
    </div>
  );
}
