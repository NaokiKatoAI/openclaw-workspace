-- 昭和映画フィルターアプリ - Database Schema

-- users テーブル（Supabase Authと連携）
-- 注意: auth.users は自動的に作成されるので、このテーブルは不要かもしれません
-- 必要に応じて profiles テーブルとして作成してください

-- subscriptions テーブル
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'light', 'pro')),
  credits INTEGER NOT NULL DEFAULT 3,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_idにインデックスを作成（検索高速化）
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- Row Level Security (RLS) を有効化
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のサブスクリプションのみ閲覧可能
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のサブスクリプションのみ更新可能
CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLSポリシー: 新規ユーザー登録時に自動的にサブスクリプション作成
CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- download_history テーブル（オプション）
CREATE TABLE IF NOT EXISTS public.download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS download_history_user_id_idx ON public.download_history(user_id);

ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own download history"
  ON public.download_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own download history"
  ON public.download_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 関数: 新規ユーザー登録時に自動的にfreeプランを作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, credits, status)
  VALUES (NEW.id, 'free', 3, 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: 新規ユーザー登録時に自動実行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
