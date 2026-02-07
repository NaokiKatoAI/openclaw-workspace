'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type AuthMode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          alert('登録完了！メールをご確認ください。');
          onSuccess();
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#8B7355]">
            {mode === 'signup' ? '新規登録' : 'ログイン'}
          </h2>
          <button
            onClick={onClose}
            className="text-3xl text-[#8B7355] hover:text-[#D2691E] transition-colors"
          >
            ×
          </button>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-[#5D4037] mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-[#8B7355] rounded-lg focus:outline-none focus:border-[#D2691E] text-gray-900 bg-white"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#5D4037] mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-[#8B7355] rounded-lg focus:outline-none focus:border-[#D2691E] text-gray-900 bg-white"
              placeholder="6文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 text-lg font-semibold text-white rounded-lg transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#D2691E] to-[#A0522D] hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? '処理中...' : mode === 'signup' ? '登録する' : 'ログイン'}
          </button>
        </form>

        {/* Google SignIn */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 text-lg font-semibold text-[#5D4037] bg-white border-2 border-[#8B7355] rounded-lg hover:bg-gray-50 transition-all mb-6"
        >
          <span className="mr-2">🔍</span> Googleでログイン
        </button>

        {/* モード切り替え */}
        <p className="text-center text-sm text-[#5D4037]">
          {mode === 'signup' ? (
            <>
              すでにアカウントをお持ちですか？{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-[#D2691E] font-semibold hover:underline"
              >
                ログイン
              </button>
            </>
          ) : (
            <>
              アカウントをお持ちでないですか？{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[#D2691E] font-semibold hover:underline"
              >
                新規登録
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
