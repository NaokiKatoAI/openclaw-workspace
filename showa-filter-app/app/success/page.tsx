'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      router.push('/');
      return;
    }

    // カウントダウン
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, router]);

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
      <div className="text-7xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-[#8B7355] mb-4">購入完了！</h1>
      <p className="text-xl text-[#5D4037] mb-8">
        ありがとうございます。<br />
        プランのアップグレードが完了しました。
      </p>
      <p className="text-sm text-[#8B7355]">
        {countdown}秒後に自動的にホームへ戻ります...
      </p>
      <button
        onClick={() => router.push('/')}
        className="mt-8 px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-[#D2691E] to-[#A0522D] rounded-full hover:shadow-lg transition-all"
      >
        今すぐホームへ
      </button>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
      <div className="text-7xl mb-6">⏳</div>
      <h1 className="text-3xl font-bold text-[#8B7355] mb-4">読み込み中...</h1>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5E6D3] to-[#E8D5C4] p-4">
      <Suspense fallback={<LoadingFallback />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
