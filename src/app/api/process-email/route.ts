import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { simpleParser } from 'mailparser';
import { Logger } from 'next-axiom';
import Groq from 'groq-sdk';
import { randomUUID } from 'crypto';

const log = new Logger();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

interface Email {
  sender: string,
  subject: string,
  body: string,
  id: string
}

interface verificationData {
  type: "code" | "link",
  value: string
}

interface completeEmailData {
  sender: string,
  subject: string,
  body: string,
  isVerificationEmail: boolean,
  verificationData: verificationData | null
}

let emailData: Email;

export async function POST(request: NextRequest) {

  console.log("PROCESSING EMAIL");

  let processedEmail: completeEmailData = {
    sender: '',
    subject: '',
    body: '',
    isVerificationEmail: false,
    verificationData: null
  }

  const snsMessage = await request.json();

  if (true) {
    const email = JSON.parse(snsMessage.Message);
    const recipient = email.mail.destination[0];
    const sender = email.mail.source;
    const base64Content = email.content;
    const decodedContent = Buffer.from(base64Content, 'base64');

    processedEmail.sender = sender;

    try {
      const parsedEmail = await simpleParser(decodedContent);
      const subject = parsedEmail.subject || 'No Subject';
      const plainTextBody = parsedEmail.text || ''; // Extract the plain text body
      const htmlBody = parsedEmail.html || plainTextBody; // Extract the HTML body

      processedEmail.subject = subject;
      processedEmail.body = htmlBody;

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

      getGroqChatCompletion(sender, subject, htmlBody)
      .then((response) => async() => {

        const jsonMatch = response?.match(/{.*}/);
        if (jsonMatch) {
      
            let data = JSON.parse(jsonMatch[0]);

            if(!data) {
              throw new Error('No data was returned from the AI model');
            }

            if (data.isVerificationEmail && data.isVerificationEmail == true) {

              if (!data.verificationData) {
                  throw new Error('No verification data was returned');
              } else {

                  if (!data.verificationData.type || !data.verificationData.value) {
                      throw new Error('Verification data was returned but it was invalid');
                  }

                  if (data.verificationData.type == 'link' && !/^https?:\/\//i.test(data.verificationDate.value)) {
                      throw new Error('A link was returned but it was invalid');
                  }

                  log.info('Verification data was located.', { data: data });

                  processedEmail.isVerificationEmail = true;
                  processedEmail.verificationData = data.verificationData;

              }

            }
      
            const { error: finalInsertError } = await supabaseServerClient
            .from('incoming_emails')
            .insert({ 
              id: randomUUID().toString(),
              email: recipient,
              sender: processedEmail.sender,
              subject: processedEmail.subject,
              body: processedEmail.body,
              created_at: new Date().toISOString(),
              processed_email: JSON.stringify(processedEmail),
              raw_email: JSON.stringify(email),
            });

            if (finalInsertError) {
              console.error('Error inserting processed email into incoming_emails:', finalInsertError);
              return NextResponse.json({ error: 'Error inserting processed email into incoming_emails' }, { status: 500 });
            }
      
            console.log(data);
      
        }

        return null;

      })
      .catch((error) => {
        console.error('Error processing email:', error);
        return NextResponse.json({ error: 'Error processing email' }, { status: 500 });
      });

    }
    catch (error) {
      console.error('Error parsing email:', error);
      return NextResponse.json({ error: 'Error parsing email' }, { status: 500 });
    }
  }
}

async function getGroqChatCompletion(sender: string, subject: string, body: string) {

  try {
      const response = await groq.chat.completions.create({
          messages: [
              {
                  role: "user",
                  content: `

Extract and return only the verification code or magic link from the email body, along with the company name that sent it.

First, determine if the email is a verification email.
Ensure that the email address itself is not selected as a verification code.

For links: Select the entire URL in <a> tags or any complete http/https link.
For codes: Identify any clearly defined verification codes, typically labeled as “code” or “verification code.”
Output:

Format the response as follows:

{
  "isVerificationEmail": true,
  "verificationData": {
    "type": "code" or "link",
    "value": "extracted_value"
  },
  "company": "company_name_here"
}

If the email is not a verification email, return:

{"isVerificationEmail": false}

Examples:

Email Body: Verification code: 7108 from ExampleCorp

Output:

{
  "isVerificationEmail": true,
  "verificationData": {
    "type": "code",
    "value": "7108"
  },
  "company": "ExampleCorp"
}

Email Body: Click the link to verify: <a href="https://example.com/verify?token=abcd1234">Verify</a>. Sent by ExampleCorp

Output:

{
  "isVerificationEmail": true,
  "verificationData": {
    "type": "link",
    "value": "https://example.com/verify?token=abcd1234"
  },
  "company": "ExampleCorp"
}

Email Body: This is a general update from ExampleCorp.

Output:

{"isVerificationEmail": false}
Return only the JSON object in the specified format.

Given Email Details:

Sender: ${sender}
Subject: ${subject}
Body: ${body}`,
              },
          ],
          model: "llama3-8b-8192",
      });

      return response.choices[0].message.content?.trim();
  } catch (error: any) {
      throw new Error(`Failed to get verification data from Groq: ${error.message}`);
  }
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