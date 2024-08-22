import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { simpleParser } from 'mailparser';

export async function POST(request: NextRequest) {
  const snsMessage = await request.json();

  if (true) {
    const email = JSON.parse(snsMessage.Message);
    const recipient = email.mail.destination[0];
    const sender = email.mail.source;
    const base64Content = email.content;
    const decodedContent = Buffer.from(base64Content, 'base64');

    try {
      const parsedEmail = await simpleParser(decodedContent);
      const subject = parsedEmail.subject || 'No Subject';
      const plainTextBody = parsedEmail.text || ''; // Extract the plain text body
      const htmlBody = parsedEmail.html || ''; // Extract the HTML body

      // Check if the recipient is "enquiries@phantomsign.com"
      if (recipient === 'enquiries@phantomsign.com') {
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Insert into the admin_emails table
        const { error: adminInsertError } = await supabaseServerClient
          .from('admin_emails')
          .insert([{
            created_at: formattedDate,
            sender: sender,
            subject: subject,
            content: htmlBody || plainTextBody, // Prefer HTML, fallback to plain text
          }]);

        if (adminInsertError) {
          console.error('Error inserting email into admin_emails:', adminInsertError);
          return NextResponse.json({ error: 'Error inserting email into admin_emails' }, { status: 500 });
        }
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
        const receivedAtEpoch = Math.floor(Date.now() / 1000);
        const { error: insertError } = await supabaseServerClient
          .from('incoming_emails')
          .insert([{
            email: recipient,
            sender: sender,
            subject: subject,
            body: htmlBody, // Prefer HTML, fallback to plain text
            created_at: receivedAtEpoch
          }]);
    
        if (insertError) {
          console.error('Error inserting email into incoming_emails:', insertError);
          return NextResponse.json({ error: 'Error inserting email into incoming_emails' }, { status: 500 });
        }
    
        return NextResponse.json({ message: 'Email processed successfully' });
      }
    } catch (error) {
      console.error('Error parsing email:', error);
      return NextResponse.json({ error: 'Error parsing email' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
  }
}
