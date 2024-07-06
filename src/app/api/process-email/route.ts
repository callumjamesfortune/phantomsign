import { NextRequest, NextResponse } from 'next/server';
import supabase from '../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  const messageType = request.headers.get('x-amz-sns-message-type');

  if (messageType === 'SubscriptionConfirmation') {
    // Confirm the subscription
    const snsMessage = await request.json();
    const response = await fetch(snsMessage.SubscribeURL);
    const text = await response.text();

    console.log('Subscription confirmed:', text);
    return NextResponse.json({ message: 'Subscription confirmed' });
  } else if (messageType === 'Notification') {
    // Handle the incoming email notification
    const snsMessage = await request.json();
    const email = JSON.parse(snsMessage.Message);

    console.log('Received email:', email);

    // Check if the recipient exists in the Supabase database
    const recipient = email.mail.destination[0];
    const { data: generatedEmails, error } = await supabase
      .from('generated_emails')
      .select('*')
      .eq('email', recipient);

    if (error) {
      console.error('Error querying Supabase:', error);
      return NextResponse.json({ error: 'Error querying Supabase' }, { status: 500 });
    }

    if (generatedEmails && generatedEmails.length > 0) {
      // Recipient exists, process the email
      console.log('Recipient exists, processing email...');
      // Call another endpoint or perform processing here

      return NextResponse.json({ message: 'Email processed successfully' });
    } else {
      console.log('Recipient does not exist in the database');
      return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
  }
}
