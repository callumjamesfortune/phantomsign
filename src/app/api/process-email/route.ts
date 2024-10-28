import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { simpleParser } from 'mailparser';
import { Logger } from 'next-axiom';
import Groq from 'groq-sdk';
import { randomUUID } from 'crypto';

const log = new Logger();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

interface Email {
  sender: string;
  subject: string;
  body: string;
  id: string;
}

interface VerificationData {
  type: "code" | "link";
  value: string;
}

interface CompleteEmailData {
  sender: string;
  subject: string;
  body: string;
  isVerificationEmail: boolean;
  verificationData: VerificationData | null;
}

export async function POST(request: NextRequest) {
  console.log("PROCESSING EMAIL");

  const snsMessage = await request.json();
  const email = JSON.parse(snsMessage.Message);
  const recipient = email.mail.destination[0];
  const sender = email.mail.source;
  const base64Content = email.content;
  const decodedContent = Buffer.from(base64Content, 'base64');

  const processedEmail: CompleteEmailData = {
    sender,
    subject: '',
    body: '',
    isVerificationEmail: false,
    verificationData: null
  };

  try {
    const parsedEmail = await simpleParser(decodedContent);
    processedEmail.subject = parsedEmail.subject || 'No Subject';
    processedEmail.body = parsedEmail.html || parsedEmail.text || '';

    if (recipient === 'enquiries@phantomsign.com') {
      await insertAdminEmail(sender, processedEmail.subject, processedEmail.body);
    }

    const { data: generatedEmails, error: queryError } = await supabaseServerClient
      .from('generated_inboxes')
      .select('*')
      .eq('email', recipient);

    if (queryError) throw new Error('Error querying Supabase');

    const response = await getGroqChatCompletion(sender, processedEmail.subject, processedEmail.body);
    if (response) {
      console.log('Groq response:', response);
      const jsonMatch = response.match(/{.*}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);

        if (data.isVerificationEmail) {
          validateVerificationData(data.verificationData);
          console.log('Verification data located.', { data });
          processedEmail.isVerificationEmail = true;
          processedEmail.verificationData = data.verificationData;
        }

        await insertProcessedEmail(processedEmail, recipient, email);
      }
    }
  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json({ error: 'Error processing email' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Email processed' }, { status: 200 });
}

async function insertAdminEmail(sender: string, subject: string, content: string) {
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear().toString().slice(-2)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const { error } = await supabaseServerClient
    .from('admin_emails')
    .insert([{ created_at: formattedDate, sender, subject, content }]);

  if (error) throw new Error('Error inserting email into admin_emails');
}

async function getGroqChatCompletion(sender: string, subject: string, body: string) {
  try {
    const response = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `
Extract and return only the verification code or magic link from the email body, along with the company name that sent it.
Ensure that the email address itself is not selected as a verification code.
For links: Select the entire URL in <a> tags or any complete http/https link.
For codes: Identify any clearly defined verification codes, typically labeled as “code” or “verification code.”
Output:

{
  "isVerificationEmail": true,
  "verificationData": {
    "type": "code" or "link",
    "value": "extracted_value"
  },
  "company": "company_name_here"
}

If not a verification email, return:
{"isVerificationEmail": false}

Sender: ${sender}
Subject: ${subject}
Body: ${body}`
      }],
      model: "llama3-8b-8192",
    });

    return response.choices[0]?.message.content?.trim();
  } catch (error: any) {
    throw new Error(`Failed to get verification data from Groq: ${error.message}`);
  }
}

function validateVerificationData(verificationData: VerificationData) {
  if (!verificationData?.type || !verificationData?.value) {
    throw new Error('Invalid verification data');
  }
  if (verificationData.type === 'link' && !/^https?:\/\//i.test(verificationData.value)) {
    throw new Error('Invalid verification link');
  }
}

async function insertProcessedEmail(processedEmail: CompleteEmailData, recipient: string, rawEmail: any) {
  const { error } = await supabaseServerClient
    .from('incoming_emails')
    .insert({
      id: randomUUID().toString(),
      email: recipient,
      sender: processedEmail.sender,
      subject: processedEmail.subject,
      body: processedEmail.body,
      created_at: new Date().toISOString(),
      processed_email: JSON.stringify(processedEmail),
      raw_email: JSON.stringify(rawEmail)
    });

  if (error) throw new Error('Error inserting processed email into incoming_emails');
}


async function updateStatistics(verificationData: any) {
  try {
      const { data, error: selectError } = await supabaseServerClient
          .from('email_statistics')
          .select('*')
          .eq('id', 1)
          .single();

      if (selectError) throw selectError;

      let newCodesFoundCount = data.codes_found_count;
      let newLinksFoundCount = data.links_found_count;

      if (verificationData.code) {
          newCodesFoundCount += 1;
      } else if (verificationData.link) {
          newLinksFoundCount += 1;
      }

      const { error: updateError } = await supabaseServerClient
          .from('email_statistics')
          .update({ 
              codes_found_count: newCodesFoundCount,
              links_found_count: newLinksFoundCount,
              updated_at: new Date().toISOString()
          })
          .eq('id', 1);

      if (updateError) throw updateError;

  } catch (error: any) {
      console.error("Error updating statistics:", error);
  }
}