import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Stripeは実行時に初期化（ビルド時エラー回避）
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  // イベント処理
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan as 'light' | 'pro';
      const subscriptionId = session.subscription as string;

      if (userId && plan) {
        // サブスクリプション更新
        const credits = plan === 'light' ? 30 : 9999; // proは実質無制限
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan,
            credits,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update subscription:', error);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      // サブスクリプションをキャンセル状態に
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          credits: 0,
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Failed to cancel subscription:', error);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      // 月次更新時にクレジットをリセット
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        // サブスクリプション情報を取得
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (sub && sub.plan === 'light') {
          // ライトプランのみクレジットリセット
          await supabase
            .from('subscriptions')
            .update({
              credits: 30,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
