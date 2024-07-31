import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';
import fetch from 'node-fetch';

async function verifySignature(snsMessage: any) {
  const { Signature, SigningCertURL, ...messageWithoutSignature } = snsMessage;

  // Sort the message attributes by name
  const messageAttributes = Object.entries(messageWithoutSignature).sort(([a], [b]) => a.localeCompare(b));

  // Create the canonical string for signature verification
  const canonicalString = messageAttributes.map(([key, value]) => `${key}\n${value}`).join('\n') + '\n';

  // Fetch the signing certificate
  const response = await fetch(SigningCertURL);
  const cert = await response.text();

  // Verify the signature
  const verifier = crypto.createVerify('SHA1');
  verifier.update(canonicalString);
  return verifier.verify(cert, Signature, 'base64');
}

export async function POST(request: NextRequest) {
  const messageType = request.headers.get('x-amz-sns-message-type');

  if (!messageType) {
    return NextResponse.json({ error: 'Missing x-amz-sns-message-type header' }, { status: 400 });
  }

  const snsMessage = await request.json();

  if (messageType === 'SubscriptionConfirmation') {
    try {
      const response = await fetch(snsMessage.SubscribeURL);
      const text = await response.text();
      console.log('Subscription confirmed:', text);
      return NextResponse.json({ message: 'Subscription confirmed' });
    } catch (error) {
      console.error('Error confirming subscription:', error);
      return NextResponse.json({ error: 'Error confirming subscription' }, { status: 500 });
    }
  } else if (messageType === 'Notification') {
    if (!await verifySignature(snsMessage)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const email = JSON.parse(snsMessage.Message);

    console.log('Received email:', email);

    const recipient = email.mail.destination[0];
    const base64Content = email.content;
    const decodedContent = Buffer.from(base64Content, 'base64');

    try {
      const parsedEmail = await simpleParser(decodedContent);
      const plainTextBody = parsedEmail.text || '';
      const receivedAtEpoch = Date.now();

      const { data: generatedEmails, error: queryError } = await supabaseServerClient
        .from('generated_emails')
        .select('*')
        .eq('email', recipient);

      if (queryError) {
        console.error('Error querying Supabase:', queryError);
        return NextResponse.json({ error: 'Error querying Supabase' }, { status: 500 });
      }

      if (generatedEmails && generatedEmails.length > 0) {
        const { error: insertError } = await supabaseServerClient
          .from('incoming_emails')
          .insert([{ email: recipient, body: plainTextBody, created_at: receivedAtEpoch }]);

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
