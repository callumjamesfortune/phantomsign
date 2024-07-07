import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:callum@seefortune.co.uk',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscriptions: any[] = [];

export async function POST(req: NextRequest) {
  const { subscription } = await req.json();
  subscriptions.push(subscription);
  return NextResponse.json({ success: true });
}
