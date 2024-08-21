import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';
import fetch from 'node-fetch';

export async function POST(request: NextRequest) {

  const snsMessage = await request.json();

  console.log("SNS request received: " + JSON.stringify(snsMessage));

  if (true) {

    const email = JSON.parse(snsMessage.Message);

    console.log('Received email:', email);

    const recipient = email.mail.destination[0];
    const sender = email.mail.source; // Assuming this is where the sender's email is stored
    const base64Content = email.content;
    const decodedContent = Buffer.from(base64Content, 'base64');

    try {
      const parsedEmail = await simpleParser(decodedContent);
      const plainTextBody = parsedEmail.text || '';

      // Check if the recipient is "enquiries@phantomsign.com"
      if (recipient === 'enquiries@phantomsign.com') {
        // Format the date as dd/mm/yy 00:00
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Insert into the admin_emails table
        const { error: adminInsertError } = await supabaseServerClient
          .from('admin_emails')
          .insert([{
            created_at: formattedDate, // Formatted date
            sender: sender, // The sender's email address
            content: plainTextBody, // The plain text body of the email
          }]);

        if (adminInsertError) {
          console.error('Error inserting email into admin_emails:', adminInsertError);
          return NextResponse.json({ error: 'Error inserting email into admin_emails' }, { status: 500 });
        }

        console.log('Admin email processed successfully');
      }

      // Continue with processing for the generated_inboxes table
      const { data: generatedEmails, error: queryError } = await supabaseServerClient
        .from('generated_inboxes')
        .select('*')
        .eq('email', recipient);

      if (queryError) {
        console.error('Error querying Supabase:', queryError);
        return NextResponse.json({ error: 'Error querying Supabase' }, { status: 500 });
      }

      if (generatedEmails && generatedEmails.length > 0) {
        const receivedAtEpoch = Math.floor(Date.now() / 1000); // Standard timestamp for other tables
        const { error: insertError } = await supabaseServerClient
          .from('incoming_emails')
          .insert([{
            email: recipient,
            body: plainTextBody,
            created_at: receivedAtEpoch
          }]);

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
