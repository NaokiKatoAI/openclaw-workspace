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
  try {
    const { plan, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // プラン価格を設定（後でStripeダッシュボードで作成したPrice IDに置き換える）
    const priceId =
      plan === 'light'
        ? process.env.NEXT_PUBLIC_STRIPE_LIGHT_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
    }

    // Stripeチェックアウトセッションを作成
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
