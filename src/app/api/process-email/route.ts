import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { simpleParser } from 'mailparser';

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

    // Extract recipient and body from the email object
    const recipient = email.mail.destination[0];
    const base64Content = email.content; // Assuming the body is in the 'content' field
    const decodedContent = Buffer.from(base64Content, 'base64');

    try {
      const parsedEmail = await simpleParser(decodedContent);
      const plainTextBody = parsedEmail.text || '';
      const receivedAt = new Date().toISOString();

      // Check if the recipient exists in the Supabase database
      const { data: generatedEmails, error: queryError } = await supabaseServerClient
        .from('generated_emails')
        .select('*')
        .eq('email', recipient);

      if (queryError) {
        console.error('Error querying Supabase:', queryError);
        return NextResponse.json({ error: 'Error querying Supabase' }, { status: 500 });
      }

      if (generatedEmails && generatedEmails.length > 0) {
        // Recipient exists, insert the email into the incoming_emails table
        const { error: insertError } = await supabaseServerClient
          .from('incoming_emails')
          .insert([{ email: recipient, body: plainTextBody, received_at: receivedAt }]);

        if (insertError) {
          console.error('Error inserting email into incoming_emails:', insertError);
          return NextResponse.json({ error: 'Error inserting email into incoming_emails' }, { status: 500 });
        }

        console.log('Email processed successfully');
        return NextResponse.json({ message: 'Email processed successfully' });
      } else {
        console.log('Recipient does not exist in the database');
        return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error parsing email:', error);
      return NextResponse.json({ error: 'Error parsing email' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
  }
}
