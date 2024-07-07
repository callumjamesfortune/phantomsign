import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:callum@seefortune.co.uk',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscriptions: any[] = [];

export async function POST(req: NextRequest) {
  const { payload } = await req.json();

  try {
    const notificationPromises = subscriptions.map(sub =>
      webpush.sendNotification(sub, JSON.stringify(payload))
    );
    await Promise.all(notificationPromises);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
