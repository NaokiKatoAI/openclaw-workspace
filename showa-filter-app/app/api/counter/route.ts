import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // カウント取得
    const { data, error } = await supabase
      .from('access_counter')
      .select('count')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Counter read error:', error);
      return NextResponse.json({ count: 1 }, { status: 200 });
    }

    return NextResponse.json({ count: data?.count || 1 });
  } catch (error) {
    console.error('Counter error:', error);
    return NextResponse.json({ count: 1 }, { status: 200 });
  }
}

export async function POST() {
  try {
    // カウント増加（increment）
    const { data, error } = await supabase.rpc('increment_counter');

    if (error) {
      console.error('Counter increment error:', error);
      // エラーでも現在のカウントを返す
      const { data: current } = await supabase
        .from('access_counter')
        .select('count')
        .eq('id', 1)
        .single();
      return NextResponse.json({ count: current?.count || 1 });
    }

    return NextResponse.json({ count: data });
  } catch (error) {
    console.error('Counter error:', error);
    return NextResponse.json({ count: 1 });
  }
}
