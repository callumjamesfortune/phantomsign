import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';
import fetch from 'node-fetch';

export async function POST(request: NextRequest) {

  const snsMessage = await request.json();

  console.log("HI: " + JSON.stringify(snsMessage));

  if (true) {

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
