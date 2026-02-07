import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'light' | 'pro';
          credits: number;
          stripe_subscription_id: string | null;
          status: 'active' | 'canceled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: 'free' | 'light' | 'pro';
          credits?: number;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'canceled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'light' | 'pro';
          credits?: number;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'canceled';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
