'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ImageEditor from './components/ImageEditor';
import AuthModal from './components/AuthModal';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'home' | 'editor' | 'pricing' | 'howto' | 'faq' | 'privacy' | 'legal' | 'terms' | 'account'>(() => {
    // リロード時に前のページを復元
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentPage') as any;
      return saved || 'home';
    }
    return 'home';
  });
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState<'free' | 'light' | 'pro'>('free');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accessCount, setAccessCount] = useState<number>(1);

  // ページ変更時にlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // 初回ロード時の認証チェック
  useEffect(() => {
    checkAuth();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserSubscription(session.user.id);
      } else {
        setUser(null);
        setCredits(0);
        setPlan('free');
        // ログインポップアップは出さない（使う時だけ出す）
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // アクセスカウンター（初回のみ）
  useEffect(() => {
    const incrementCounter = async () => {
      try {
        const response = await fetch('/api/counter', { method: 'POST' });
        const data = await response.json();
        setAccessCount(data.count || 1);
      } catch (error) {
        console.error('Counter error:', error);
      }
    };

    incrementCounter();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(session.user);
      await loadUserSubscription(session.user.id);
    }
    // ログインしてなくてもポップアップは出さない（使う時だけ出す）

    setIsLoading(false);
  };

  const loadUserSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setCredits(data.credits);
      setPlan(data.plan);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCredits(0);
    setPlan('free');
    setIsAuthModalOpen(true);
  };

  const handlePlanPurchase = async (selectedPlan: 'light' | 'pro') => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Stripeチェックアウトページへリダイレクト
        window.location.href = data.url;
      } else {
        alert('エラーが発生しました: ' + data.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('エラーが発生しました');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#F5E6D3] to-[#E8D5C4]">
        <div className="text-center">
          <div className="text-6xl mb-4">🎞️</div>
          <p className="text-2xl text-[#8B7355]">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {}}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          checkAuth();
        }}
      />

      <div className="flex h-screen" style={{
        background: '#F5E6D3',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(139,115,85,0.03) 50px, rgba(139,115,85,0.03) 51px),
          repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(139,115,85,0.03) 50px, rgba(139,115,85,0.03) 51px)
        `
      }}>
      {/* モバイルヘッダー */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#8B4513] px-3 py-2 z-50 border-b-4 border-[#5D4037]">
        <div className="flex items-center justify-between w-full">
          <button onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }} className="active:scale-95 active:opacity-70 transition-all duration-100">
            <Image src="/logo.png" alt="昭和Pictures" width={120} height={36} className="h-9 w-auto" priority />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-[#FFFEF0] text-2xl w-11 h-11 bg-[#A0522D] rounded-md border-2 border-[#FFFEF0] flex-shrink-0 ml-2 active:scale-95 transition-transform flex items-center justify-center leading-none"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-[#E8D5C4] z-40 border-b-4 border-[#8B7355] shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-2 space-y-1">
            {user && (
              <div className="bg-[#D2691E]/10 p-2 rounded-lg mb-2 text-center">
                <p className="text-xs text-[#8B7355]">現在のプラン</p>
                <p className="text-base font-bold text-[#D2691E]">
                  {plan === 'free' && '🆓 無料'}
                  {plan === 'light' && '⭐ ライト'}
                  {plan === 'pro' && '👑 プロ'}
                </p>
                <p className="text-xs text-[#5D4037]">残り: {plan === 'pro' ? '無制限' : `${credits}枚`}</p>
              </div>
            )}
            <button
              onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'home' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              🏠 ホーム
            </button>
            <button
              onClick={() => { setCurrentPage('editor'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'editor' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              ✨ 使ってみる
            </button>
            <button
              onClick={() => { setCurrentPage('howto'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'howto' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              📖 使い方
            </button>
            <button
              onClick={() => { setCurrentPage('pricing'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'pricing' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              💳 プラン
            </button>
            <button
              onClick={() => { setCurrentPage('faq'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'faq' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              ❓ FAQ
            </button>
            <button
              onClick={() => { setCurrentPage('privacy'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'privacy' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              🔒 プライバシー
            </button>
            <button
              onClick={() => { setCurrentPage('legal'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'legal' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              📜 特商法表記
            </button>
            <button
              onClick={() => { setCurrentPage('terms'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'terms' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              📋 利用規約
            </button>
            <button
              onClick={() => { setCurrentPage('account'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${currentPage === 'account' ? 'bg-[#D2691E] text-white' : 'text-[#5D4037]'}`}
            >
              👤 アカウント
            </button>
            {user && (
              <button
                onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-[#5D4037] border-t border-[#8B7355] mt-1 pt-2"
              >
                🚪 ログアウト
              </button>
            )}
          </div>
        </div>
      )}

      {/* レフトナビ - 昭和の喫茶店風（モバイルでは非表示） */}
      <nav className="hidden md:flex w-72 bg-[#FFFEF0] p-8 pb-24 shadow-2xl flex-col border-r-4 border-[#8B7355] overflow-y-auto">
        <div className="text-center mb-8">
          <Image 
            src="/logo.png" 
            alt="昭和Pictures" 
            width={200}
            height={60}
            className="w-full max-w-[200px] mx-auto cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setCurrentPage('home')}
            priority
          />
        </div>

        {/* 現在のプラン表示 */}
        {user && (
          <div className="mb-6 p-4 bg-[#D2691E]/10 rounded-lg border-2 border-[#D2691E]">
            <p className="text-xs text-[#8B7355] mb-2 text-center">現在のプラン</p>
            <p className="text-2xl font-bold text-[#D2691E] text-center mb-3">
              {plan === 'free' && '🆓 無料プラン'}
              {plan === 'light' && '⭐ ライトプラン'}
              {plan === 'pro' && '👑 プロプラン'}
            </p>
            <div className="border-t border-[#8B7355]/30 pt-3">
              <p className="text-xs text-[#8B7355] text-center">残りクレジット</p>
              <p className="text-2xl font-bold text-[#5D4037] text-center">
                {plan === 'pro' ? '無制限' : `${credits}枚`}
              </p>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setCurrentPage('home')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'home'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">🏠</span> ホーム
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('editor')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'editor'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">✨</span> 使ってみる
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('howto')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'howto'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">📖</span> 使い方
            </button>
          </li>

          <div className="h-px bg-[#8B7355]/30 my-6"></div>

          <li>
            <button
              onClick={() => setCurrentPage('pricing')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'pricing'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">💳</span> プラン
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('faq')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'faq'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">❓</span> FAQ
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('privacy')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'privacy'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">🔒</span> プライバシー
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('legal')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'legal'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">📜</span> 特商法表記
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('terms')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'terms'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">📋</span> 利用規約
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('account')}
              className={`w-full text-left px-5 py-4 rounded-lg transition-all border-2 ${
                currentPage === 'account'
                  ? 'bg-[#D2691E]/10 border-[#D2691E] font-semibold'
                  : 'border-transparent hover:bg-[#8B7355]/10 hover:border-[#D2691E]'
              } text-[#5D4037]`}
            >
              <span className="mr-2">👤</span> アカウント
            </button>
          </li>
        </ul>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto px-4 md:px-12 pt-20 md:pt-12 pb-0">
        {/* ホーム */}
        {currentPage === 'home' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="text-center py-12">
              <div className="inline-block bg-[#8B4513] px-6 py-2 mb-4 transform -rotate-2">
                <p className="text-[#FFD700] text-sm tracking-widest">〜 昭和・大正・明治 〜</p>
              </div>
              <h2 className="text-2xl md:text-5xl text-[#3E2723] mb-4 tracking-wider" style={{textShadow: '2px 2px 0 #D2B48C'}}>
                <span className="block md:inline">最新の写真が、</span>
                <span className="block md:inline">最古の思い出に。</span>
              </h2>
              <p className="text-lg md:text-2xl text-[#5D4037] mb-6 md:mb-8">ワンクリックで、時を超える。</p>
              <button
                onClick={() => setCurrentPage('editor')}
                className="retro-btn px-12 py-5 text-xl font-bold text-[#FFFEF0] bg-[#8B4513] rounded-none border-4 border-[#5D4037]"
                style={{boxShadow: '6px 6px 0 #3E2723'}}
              >
                ✨ 今すぐ始める ✨
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 mt-8 md:mt-12 md:scale-110 origin-top">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full">
                <div className="flex-1">
                  <div className="bg-[#3E2723] p-3" style={{boxShadow: '5px 5px 0 #1a1a1a'}}>
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <Image 
                        src="/samples/before.jpg" 
                        alt="現代の写真 - 香港の街並み（加工前）" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                  <p className="mt-3 font-bold text-[#3E2723] text-center text-lg bg-[#FFD700] inline-block px-4 py-1 mx-auto" style={{display: 'table', margin: '12px auto 0'}}>現代</p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <div className="text-4xl animate-pulse">⏰</div>
                  <div className="w-0.5 h-8 bg-[#8B7355] my-2"></div>
                  <p className="text-sm text-[#5D4037] font-bold writing-vertical" style={{writingMode: 'vertical-rl'}}>時を超える</p>
                </div>

                <div className="flex-1">
                  <div className="bg-[#8B4513] p-3" style={{boxShadow: '5px 5px 0 #3E2723'}}>
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <Image 
                        src="/samples/after.jpg" 
                        alt="昭和風に変換された写真 - レトロな香港の街並み（加工後）" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                  <p className="mt-3 font-bold text-[#FFFEF0] text-center text-lg bg-[#8B4513] inline-block px-4 py-1" style={{display: 'table', margin: '12px auto 0'}}>昭和</p>
                </div>
              </div>
            </div>

            <p className="text-center text-base md:text-2xl italic text-[#5D4037] mt-8 md:mt-12">
              "あの時代の空気を、この一枚に"
            </p>

            {/* アクセスカウンター */}
            <div className="mt-12 text-center">
              <p className="text-[#8B7355] mb-2 text-lg">あなたは</p>
              <div className="inline-block access-counter rounded">
                {accessCount.toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false }).replace(/(\d{3})(?=\d)/g, '$1,')}
              </div>
              <p className="text-[#8B7355] mt-2 text-lg">人目の訪問者です</p>
              <p className="text-xs text-[#8B7355] mt-1">since 2026</p>
            </div>

            {/* 2000年代インターネット要素 */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 items-center">
              {/* キリ番ゲット - 10, 50, 100, 500, 1000, 5000, 10000などの時だけ表示 */}
              {(() => {
                const count = accessCount;
                const kiriban = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];
                if (kiriban.includes(count)) {
                  return (
                    <div className="bg-[#FF69B4] text-white px-4 py-2 border-4 border-[#FF1493] text-sm font-bold" style={{boxShadow: '3px 3px 0 #8B008B'}}>
                      🎉 <span className="blink">{count.toLocaleString()}人目キリ番ゲット！</span> 🎉
                    </div>
                  );
                }
                return null;
              })()}

              {/* リンクフリーバナー */}
              <div className="bg-[#000080] text-[#00FFFF] px-4 py-2 border-2 border-[#00FFFF] text-xs font-bold">
                📎 リンクフリーです！<br />
                <span className="text-[#FFFF00]">直リンクはご遠慮ください</span>
              </div>

            </div>

            {/* フッター風 */}
            <div className="mt-8 text-center text-xs text-[#8B7355]">
              <p>💻 このサイトは800×600以上で快適にご覧いただけます</p>
              <p className="mt-1">📧 ご意見・ご感想はゲストブックまで（嘘）</p>
            </div>

            {/* お知らせ */}
            <div className="mt-12 bg-[#FFFEF0] rounded-xl p-6 md:p-8 max-w-2xl mx-auto border-2 border-[#D2691E]">
              <h3 className="text-xl md:text-2xl text-[#D2691E] mb-4 font-semibold flex items-center gap-2">
                📰 お知らせ
              </h3>
              <ul className="space-y-3 text-[#5D4037]">
                <li className="flex gap-3 items-start">
                  <span className="text-sm text-[#8B7355] whitespace-nowrap font-mono">2026/02/07</span>
                  <span>🎉 昭和Pictures サイトオープンしました！ <span className="blink text-[#FF0000] font-bold" style={{textShadow: '1px 1px 0 #FFFF00'}}>✨NEW!✨</span></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-sm text-[#8B7355] whitespace-nowrap font-mono">2026/02/07</span>
                  <span>🎞️ 時代フィルター（昭和・大正・明治）を追加しました！ <span className="blink text-[#FF0000] font-bold" style={{textShadow: '1px 1px 0 #FFFF00'}}>✨NEW!✨</span></span>
                </li>
              </ul>
            </div>

            <div className="mt-12 bg-white/50 rounded-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-xl md:text-2xl text-[#8B7355] mb-4 font-semibold">昭和Picturesとは？</h3>
              <p className="text-[#5D4037] leading-relaxed">
                昭和Picturesは、あなたの写真をワンクリックでレトロな昭和映画風・ポラロイド風に変換するサービスです。
                SNS映えする懐かしい雰囲気の写真を簡単に作成できます。
              </p>
              <ul className="mt-4 text-[#5D4037] space-y-2">
                <li>✨ ワンクリックで簡単変換</li>
                <li>📱 iPhone（HEIC形式）対応</li>
                <li>🎨 ポラロイド風の暖かい色調</li>
                <li>💾 高解像度でダウンロード可能</li>
              </ul>
            </div>
          </div>
        )}

        {/* エディタ */}
        {currentPage === 'editor' && (
          <ImageEditor
            user={user}
            credits={credits}
            plan={plan}
            onCreditsUpdate={loadUserSubscription}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* プラン */}
        {currentPage === 'pricing' && (
          <div className="max-w-5xl mx-auto animate-fadeIn px-2 md:px-0">
            <h2 className="text-2xl md:text-4xl text-[#8B7355] mb-6 md:mb-12 font-light tracking-wider text-center">
              プランを選ぶ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {/* 無料プラン */}
              <div className="bg-white border-4 border-[#8B7355] rounded-xl p-4 md:p-8 text-center shadow-lg hover:-translate-y-2 transition-all">
                <h3 className="text-2xl md:text-3xl text-[#8B7355] mb-2 md:mb-4">無料</h3>
                <div className="text-3xl md:text-5xl font-bold text-[#D2691E] mb-1 md:mb-2">¥0</div>
                <div className="text-lg md:text-xl text-[#5D4037] mb-4 md:mb-8">3枚まで</div>
                <button
                  onClick={() => setCurrentPage('editor')}
                  className="w-full py-3 md:py-4 text-base md:text-lg font-semibold text-white bg-[#8B7355] rounded-lg hover:bg-[#A0522D] transition-all"
                >
                  今すぐ試す
                </button>
              </div>

              {/* ライトプラン（人気） */}
              <div className="bg-white border-4 border-[#D2691E] rounded-xl p-4 md:p-8 text-center shadow-xl md:transform md:scale-105 hover:-translate-y-2 transition-all">
                <h3 className="text-2xl md:text-3xl text-[#8B7355] mb-2 md:mb-4">ライト</h3>
                <div className="text-3xl md:text-5xl font-bold text-[#D2691E] mb-1 md:mb-2">
                  ¥500<span className="text-sm md:text-base">/月</span>
                </div>
                <div className="text-lg md:text-xl text-[#5D4037] mb-4 md:mb-8">30枚/月</div>
                <button
                  onClick={() => handlePlanPurchase('light')}
                  disabled={plan === 'light' || plan === 'pro'}
                  className={`w-full py-3 md:py-4 text-base md:text-lg font-semibold text-white rounded-lg transition-all ${
                    plan === 'light' || plan === 'pro'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#D2691E] to-[#A0522D] hover:shadow-xl'
                  }`}
                >
                  {plan === 'light' ? '現在のプラン' : plan === 'pro' ? 'プロプラン利用中' : '選択する'}
                </button>
              </div>

              {/* プロプラン */}
              <div className="bg-white border-4 border-[#8B7355] rounded-xl p-4 md:p-8 text-center shadow-lg hover:-translate-y-2 transition-all">
                <h3 className="text-2xl md:text-3xl text-[#8B7355] mb-2 md:mb-4">プロ</h3>
                <div className="text-3xl md:text-5xl font-bold text-[#D2691E] mb-1 md:mb-2">
                  ¥1,000<span className="text-sm md:text-base">/月</span>
                </div>
                <div className="text-lg md:text-xl text-[#5D4037] mb-4 md:mb-8">無制限</div>
                <button
                  onClick={() => handlePlanPurchase('pro')}
                  disabled={plan === 'pro'}
                  className={`w-full py-3 md:py-4 text-base md:text-lg font-semibold text-white rounded-lg transition-all ${
                    plan === 'pro'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#8B7355] hover:bg-[#A0522D]'
                  }`}
                >
                  {plan === 'pro' ? '現在のプラン' : '選択する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 使い方 */}
        {currentPage === 'howto' && (
          <div className="max-w-4xl mx-auto animate-fadeIn px-2 md:px-0">
            <h2 className="text-2xl md:text-4xl text-[#8B7355] mb-6 md:mb-8 font-light tracking-wider">使い方</h2>
            
            <div className="space-y-8">
              {/* 基本的な使い方 */}
              <section className="bg-white rounded-xl p-6 md:p-8 shadow-lg border-2 border-[#8B7355]">
                <h3 className="text-2xl font-bold text-[#8B7355] mb-4">📖 基本的な使い方</h3>
                <ol className="space-y-4 text-[#5D4037]">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#D2691E] text-white rounded-full flex items-center justify-center font-bold">1</span>
                    <div>
                      <strong className="text-lg">写真をアップロード</strong>
                      <p className="text-sm mt-1">「使ってみる」ページで写真をクリック、またはドラッグ&ドロップでアップロードします。</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#D2691E] text-white rounded-full flex items-center justify-center font-bold">2</span>
                    <div>
                      <strong className="text-lg">時代を選択</strong>
                      <p className="text-sm mt-1">明治（モノクロ）、大正（セピア）、昭和（ポラロイド風）から選びます。</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#D2691E] text-white rounded-full flex items-center justify-center font-bold">3</span>
                    <div>
                      <strong className="text-lg">⏰ タイムスリップ！</strong>
                      <p className="text-sm mt-1">ボタンを押すとフィルターが適用され、プレビューが表示されます。</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#D2691E] text-white rounded-full flex items-center justify-center font-bold">4</span>
                    <div>
                      <strong className="text-lg">📥 ダウンロード</strong>
                      <p className="text-sm mt-1">ダウンロードボタンを押します。（クレジット1枚消費）</p>
                    </div>
                  </li>
                </ol>
              </section>

              {/* デバイス別の保存方法 */}
              <section className="bg-white rounded-xl p-6 md:p-8 shadow-lg border-2 border-[#8B7355]">
                <h3 className="text-2xl font-bold text-[#8B7355] mb-4">💾 デバイス別の保存方法</h3>
                
                <div className="space-y-6">
                  {/* iPhone/iPad */}
                  <div className="bg-[#F5E6D3] rounded-lg p-4">
                    <h4 className="text-xl font-bold text-[#5D4037] mb-3 flex items-center gap-2">
                      <span>📱</span> iPhone / iPad
                    </h4>
                    <ol className="space-y-2 text-sm text-[#5D4037]">
                      <li>1. ダウンロードボタンを押す</li>
                      <li>2. 共有シートが開きます</li>
                      <li>3. 「画像を保存」または「写真に追加」を選択</li>
                      <li>4. 写真アプリに保存されます</li>
                    </ol>
                    <p className="mt-3 text-xs text-[#8B7355]">※共有シートが表示されない場合は、ブラウザを最新版に更新してください。</p>
                  </div>

                  {/* Android */}
                  <div className="bg-[#F5E6D3] rounded-lg p-4">
                    <h4 className="text-xl font-bold text-[#5D4037] mb-3 flex items-center gap-2">
                      <span>🤖</span> Android
                    </h4>
                    <ol className="space-y-2 text-sm text-[#5D4037]">
                      <li>1. ダウンロードボタンを押す</li>
                      <li>2. 自動的にダウンロードフォルダに保存されます</li>
                      <li>3. Googleフォト・ギャラリーで自動的に表示されます</li>
                    </ol>
                  </div>

                  {/* PC */}
                  <div className="bg-[#F5E6D3] rounded-lg p-4">
                    <h4 className="text-xl font-bold text-[#5D4037] mb-3 flex items-center gap-2">
                      <span>💻</span> PC（Windows / Mac）
                    </h4>
                    <ol className="space-y-2 text-sm text-[#5D4037]">
                      <li>1. ダウンロードボタンを押す</li>
                      <li>2. ダウンロードフォルダに保存されます</li>
                    </ol>
                  </div>
                </div>
              </section>

              {/* iPhoneのHEIC形式について */}
              <section className="bg-[#FFF3CD] rounded-xl p-6 md:p-8 shadow-lg border-l-4 border-[#FFD700]">
                <h3 className="text-xl font-bold text-[#5D4037] mb-3">📸 iPhoneのHEIC形式について</h3>
                <p className="text-[#5D4037] mb-2">
                  iPhoneで撮影した写真（HEIC形式）も問題なくアップロードできます。
                </p>
                <p className="text-sm text-[#8B7355]">
                  ※HEIC形式は自動的にJPEGに変換されます。処理に数秒かかる場合があります。
                </p>
              </section>

              {/* トラブルシューティング */}
              <section className="bg-white rounded-xl p-6 md:p-8 shadow-lg border-2 border-[#8B7355]">
                <h3 className="text-2xl font-bold text-[#8B7355] mb-4">🔧 よくあるトラブル</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#5D4037] mb-2">Q. iPhoneで共有シートが表示されない</h4>
                    <p className="text-sm text-[#5D4037]">→ Safariまたはブラウザを最新版に更新してください。</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#5D4037] mb-2">Q. ダウンロードボタンが反応しない</h4>
                    <p className="text-sm text-[#5D4037]">→ 先に「タイムスリップ！」ボタンを押してフィルターを適用してください。</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#5D4037] mb-2">Q. 画像がアップロードできない</h4>
                    <p className="text-sm text-[#5D4037]">→ JPEG、PNG、WebP、HEIC形式のみ対応しています。他の形式は事前に変換してください。</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* FAQ */}
        {currentPage === 'faq' && (
          <div className="max-w-4xl mx-auto animate-fadeIn px-2 md:px-0">
            {/* 構造化データ（JSON-LD） */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "料金について",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "無料プランでは3枚まで無料でお試しいただけます。ライトプラン（月額500円）、プロプラン（月額1,000円）は月額課金のサブスクリプションとなります。ご契約後は毎月自動で課金されますのでご注意ください。"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "解約について",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "サブスクリプションはいつでも解約可能です。解約後も、その月の残り期間は引き続きご利用いただけます。解約は「アカウント」ページから行えます。"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "返金について",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "原則として、決済後のご返金は承っておりません。ご購入前に必ず無料プランでお試しの上、ご検討ください。"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "対応フォーマット",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "JPEG、PNG、WebP形式に対応しています。iPhoneのHEIC形式も自動で変換されます。"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "クレジットとは？",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "クレジットは画像をダウンロードする際に1枚消費されます。プレビュー（フィルター適用の確認）は無料です。プロプランは無制限でダウンロードできます。"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "画像の取り扱い",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "アップロードされた画像はサーバーに保存されません。すべての処理はお使いのブラウザ内で完結します。"
                      }
                    }
                  ]
                })
              }}
            />
            
            <h2 className="text-2xl md:text-4xl text-[#8B7355] mb-6 md:mb-8 font-light tracking-wider">よくある質問</h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#D2691E]">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-2">💳 料金について</h3>
                <p className="text-[#5D4037]">
                  無料プランでは3枚まで無料でお試しいただけます。<br />
                  ライトプラン（月額500円）、プロプラン（月額1,000円）は<strong className="text-[#D2691E]">月額課金のサブスクリプション</strong>となります。<br />
                  ご契約後は毎月自動で課金されますのでご注意ください。
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#8B7355]">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-2">🔄 解約について</h3>
                <p className="text-[#5D4037]">
                  サブスクリプションはいつでも解約可能です。<br />
                  解約後も、その月の残り期間は引き続きご利用いただけます。<br />
                  解約は「アカウント」ページから行えます。
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#8B7355]">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-2">💰 返金について</h3>
                <p className="text-[#5D4037]">
                  <strong>原則として、決済後のご返金は承っておりません。</strong><br />
                  ご購入前に必ず無料プランでお試しの上、ご検討ください。
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#8B7355]">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-2">📱 対応フォーマット</h3>
                <p className="text-[#5D4037]">
                  JPEG、PNG、WebP形式に対応しています。<br />
                  iPhoneのHEIC形式も自動で変換されます。
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#8B7355]">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-2">🎨 クレジットとは？</h3>
                <p className="text-[#5D4037]">
                  クレジットは画像をダウンロードする際に1枚消費されます。<br />
                  プレビュー（フィルター適用の確認）は無料です。<br />
                  プロプランは無制限でダウンロードできます。
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#8B7355]">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-2">🔒 画像の取り扱い</h3>
                <p className="text-[#5D4037]">
                  アップロードされた画像はサーバーに保存されません。<br />
                  すべての処理はお使いのブラウザ内で完結します。
                </p>
              </div>

              <div className="bg-[#FFF3CD] rounded-xl p-6 shadow-lg border-l-4 border-[#FFD700]">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-2">⚠️ ご注意</h3>
                <p className="text-[#5D4037]">
                  <strong>ライトプラン・プロプランは月額課金です。</strong><br />
                  ご購入前に必ず料金プランをご確認ください。
                </p>
              </div>

              {/* お問い合わせフォーム */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#D2691E] mt-8">
                <h3 className="text-xl font-semibold text-[#8B7355] mb-4">📧 お問い合わせ</h3>
                <p className="text-[#5D4037] mb-4">
                  ご質問・ご要望がございましたら、以下のフォームよりお問い合わせください。
                </p>
                
                <form
                  action="https://formsubmit.co/showa.pictures@gmail.com"
                  method="POST"
                  className="space-y-4"
                >
                  <input type="hidden" name="_subject" value="【昭和Pictures】お問い合わせ" />
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="_next" value="http://localhost:3000/thanks" />
                  
                  <div>
                    <label className="block text-[#5D4037] font-semibold mb-1 text-sm">お名前</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full p-3 border-2 border-[#8B7355] rounded-lg focus:border-[#D2691E] focus:outline-none text-[#3E2723] placeholder-[#8B7355]"
                      placeholder="山田 太郎"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5D4037] font-semibold mb-1 text-sm">メールアドレス</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full p-3 border-2 border-[#8B7355] rounded-lg focus:border-[#D2691E] focus:outline-none text-[#3E2723] placeholder-[#8B7355]"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5D4037] font-semibold mb-1 text-sm">お問い合わせ内容</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      className="w-full p-3 border-2 border-[#8B7355] rounded-lg focus:border-[#D2691E] focus:outline-none resize-none text-[#3E2723] placeholder-[#8B7355]"
                      placeholder="お問い合わせ内容をご記入ください"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 text-lg font-semibold text-white bg-gradient-to-r from-[#D2691E] to-[#A0522D] rounded-lg hover:shadow-xl transition-all"
                  >
                    送信する
                  </button>
                </form>

                <p className="mt-4 text-xs text-[#8B7355] text-center">
                  通常2〜3営業日以内にご返信いたします。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 特商法表記 */}
        {currentPage === 'legal' && (
          <div className="max-w-4xl mx-auto animate-fadeIn px-2 md:px-0">
            <h2 className="text-2xl md:text-4xl text-[#8B7355] mb-6 md:mb-8 font-light tracking-wider">特定商取引法に基づく表記</h2>
            
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border-2 border-[#8B7355]">
              <table className="w-full text-sm md:text-base">
                <tbody className="divide-y divide-[#E8D5C4]">
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top w-1/3">販売業者</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">昭和Pictures</td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">代表者</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">請求があった場合に遅滞なく開示いたします</td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">所在地</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">請求があった場合に遅滞なく開示いたします</td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">連絡先</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">showa.pictures@gmail.com</td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">販売価格</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">
                      ・無料プラン：0円（3枚まで）<br />
                      ・ライトプラン：月額500円（税込）<br />
                      ・プロプラン：月額1,000円（税込）<br />
                      <button onClick={() => setCurrentPage('pricing')} className="text-[#D2691E] underline hover:text-[#A0522D] mt-2 inline-block">→ 料金プランの詳細はこちら</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">支払方法</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">クレジットカード（Stripe決済）</td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">支払時期</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">購入時に即時決済。以降毎月同日に自動更新。</td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">サービス提供時期</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">決済完了後、即時ご利用いただけます</td>
                  </tr>
                  <tr>
                    <td className="py-3 md:py-4 pr-4 font-semibold text-[#8B7355] whitespace-nowrap align-top">返品・キャンセル</td>
                    <td className="py-3 md:py-4 text-[#5D4037]">デジタルサービスの性質上、決済完了後の返金は原則としてお受けしておりません。解約はいつでも可能で、解約後は次回更新日まで引き続きご利用いただけます。</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-sm text-[#8B7355] text-center">
              ご不明な点がございましたら、上記連絡先までお問い合わせください。
            </p>
          </div>
        )}

        {/* プライバシーポリシー */}
        {currentPage === 'privacy' && (
          <div className="max-w-4xl mx-auto animate-fadeIn px-2 md:px-0">
            <h2 className="text-2xl md:text-4xl text-[#8B7355] mb-6 md:mb-8 font-light tracking-wider">プライバシーポリシー</h2>
            
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border-2 border-[#8B7355] space-y-6">
              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">🔒 はじめに</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  昭和Pictures（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本ポリシーでは、当サービスにおける個人情報の取り扱いについて説明します。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">📷 画像の取り扱い</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  <strong>アップロードされた画像はサーバーに保存されません。</strong><br />
                  すべての画像処理はお使いのブラウザ内で完結します。当サービスは画像データを収集、保存、または第三者に提供することはありません。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">🔐 パスワードについて</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  パスワードは暗号化（ハッシュ化）されて保存されます。運営者を含め、誰もパスワードを見ることはできません。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">📧 メールアドレスについて</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  メールアドレスはアカウント管理のためにのみ使用します。広告やスパムメールの送信、第三者への提供は一切行いません。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">💳 決済情報について</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  クレジットカード情報はStripe（決済サービス）が安全に管理しており、当サービスでは一切保持しません。Stripeのプライバシーポリシーについては、<a href="https://stripe.com/jp/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D2691E] underline hover:text-[#A0522D]">Stripe公式サイト</a>をご確認ください。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">🍪 Cookieについて</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  当サービスでは、ログイン状態の維持やサービスの改善のためにCookieを使用する場合があります。Cookieは個人を特定する情報を含みません。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">📊 アクセス解析</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  当サービスでは、サービスの改善を目的としてアクセス解析ツールを使用する場合があります。収集されるデータは匿名化されており、個人を特定することはできません。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">✏️ ポリシーの変更</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  当サービスは、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、サービス内で通知いたします。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-3">📬 お問い合わせ</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  プライバシーに関するご質問・ご懸念がございましたら、<button onClick={() => setCurrentPage('faq')} className="text-[#D2691E] underline hover:text-[#A0522D]">お問い合わせフォーム</button>よりご連絡ください。
                </p>
              </section>
            </div>

            <p className="mt-6 text-sm text-[#8B7355] text-center">
              最終更新日：2026年2月7日
            </p>
          </div>
        )}

        {/* 利用規約 */}
        {currentPage === 'terms' && (
          <div className="max-w-4xl mx-auto animate-fadeIn px-2 md:px-0">
            <h2 className="text-2xl md:text-4xl text-[#8B7355] mb-6 md:mb-8 font-light tracking-wider">利用規約</h2>
            
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border-2 border-[#8B7355] space-y-6">
              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第1条（適用）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  本規約は、昭和Pictures（以下「当サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意の上、当サービスをご利用ください。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第2条（サービス内容）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  当サービスは、ユーザーがアップロードした画像にレトロ風フィルターを適用し、加工済み画像をダウンロードできるサービスを提供します。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第3条（料金・支払い）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  有料プランの料金は、プランページに記載の通りです。支払いはクレジットカード（Stripe決済）で行い、月額サブスクリプションとして毎月自動更新されます。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第4条（解約）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  ユーザーはいつでも有料プランを解約できます。解約後も、当該請求期間の終了まではサービスをご利用いただけます。日割り返金は行いません。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第5条（禁止事項）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  以下の行為を禁止します：<br />
                  ・法令または公序良俗に違反する行為<br />
                  ・他者の権利を侵害するコンテンツのアップロード<br />
                  ・サービスの運営を妨害する行為<br />
                  ・不正アクセスやシステムへの攻撃
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第6条（免責事項）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  当サービスは現状有姿で提供され、特定目的への適合性を保証しません。サービス利用により生じた損害について、当方は一切の責任を負いません。
                </p>
              </section>

              <section className="bg-[#FFF3CD] p-4 rounded-lg border-l-4 border-[#FFD700]">
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第7条（サービスの変更・停止・終了）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  <strong>1.</strong> 当方は、事前の通知なくサービス内容を変更、または一時的に停止することがあります。<br /><br />
                  <strong>2.</strong> 当方は、30日前までにユーザーに通知することにより、サービスを終了することができます。<br /><br />
                  <strong>3.</strong> サービス終了時、有料プランの残存期間がある場合は、日割り計算により返金いたします。<br /><br />
                  <strong>4.</strong> サービス終了後、ユーザーのアカウント情報および関連データは削除されます。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第8条（規約の変更）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  当方は、必要に応じて本規約を変更できます。重要な変更がある場合は、サービス内で通知します。変更後もサービスを利用し続けた場合、変更に同意したものとみなします。
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#8B7355] mb-2">第9条（準拠法・管轄）</h3>
                <p className="text-[#5D4037] text-sm leading-relaxed">
                  本規約は日本法に準拠し、紛争が生じた場合は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </section>

              <p className="text-xs text-[#8B7355] text-right pt-4 border-t border-[#E8D5C4]">
                制定日：2026年2月7日
              </p>
            </div>
          </div>
        )}

        {/* アカウント */}
        {currentPage === 'account' && (
          <div className="max-w-4xl mx-auto animate-fadeIn px-2 md:px-0">
            <h2 className="text-2xl md:text-4xl text-[#8B7355] mb-6 md:mb-8 font-light tracking-wider">アカウント</h2>
            {user ? (
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <p className="text-[#5D4037] mb-4">
                  <strong>メールアドレス：</strong> {user.email}
                </p>
                <p className="text-[#5D4037] mb-4">
                  <strong>現在のプラン：</strong> {plan === 'free' ? '無料' : plan === 'light' ? 'ライト' : 'プロ'}
                </p>
                <p className="text-[#5D4037] mb-6">
                  <strong>残りクレジット：</strong> {plan === 'pro' ? '無制限' : `${credits}枚`}
                </p>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-3 bg-[#8B7355] text-white rounded-lg hover:bg-[#A0522D] transition-all"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <p className="text-xl text-[#5D4037]">ログインしてください。</p>
            )}
          </div>
        )}
        {/* フッター */}
        <footer className="bg-[#5D4037] text-[#FFFEF0] py-8 mt-12 -mx-4 md:-mx-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <h3 className="font-bold mb-3 text-[#FFD700]">サービス</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => setCurrentPage('editor')} className="hover:text-[#FFD700] transition-colors">
                      写真を変換
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('pricing')} className="hover:text-[#FFD700] transition-colors">
                      料金プラン
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('howto')} className="hover:text-[#FFD700] transition-colors">
                      使い方
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3 text-[#FFD700]">サポート</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => setCurrentPage('faq')} className="hover:text-[#FFD700] transition-colors">
                      よくある質問
                    </button>
                  </li>
                  <li>
                    <a href="mailto:showa.pictures@gmail.com" className="hover:text-[#FFD700] transition-colors">
                      お問い合わせ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3 text-[#FFD700]">法的情報</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => setCurrentPage('privacy')} className="hover:text-[#FFD700] transition-colors">
                      プライバシーポリシー
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('terms')} className="hover:text-[#FFD700] transition-colors">
                      利用規約
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3 text-[#FFD700]">SNS</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="https://twitter.com/showapictures" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD700] transition-colors">
                      Twitter / X
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-[#8B7355] pt-6 text-center text-sm">
              <p>&copy; 2026 昭和Pictures. All rights reserved.</p>
              <p className="mt-2 text-xs text-[#D2B48C]">最新の写真が、最古の思い出に。</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
    </>
  );
}
