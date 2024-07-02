import { NextRequest, NextResponse } from 'next/server';
import TempEmailService from 'src/lib/tempEmailService';
import Groq from 'groq-sdk';

const apiKey = process.env.MAILSLURP_API_KEY as string;
const tempEmailService = new TempEmailService(apiKey);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

const POLLING_INTERVAL = 2000; // 2 seconds
const POLLING_TIMEOUT = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inboxId = searchParams.get('inboxId');

  if (!inboxId) {
    return NextResponse.json({ error: 'Inbox ID is required' }, { status: 400 });
  }

  try {
    const latestEmail = await pollForEmail(inboxId, POLLING_TIMEOUT, POLLING_INTERVAL);
    if (!latestEmail) {
      return NextResponse.json({ message: 'No email yet' }, { status: 200 });
    }

    const emailBody = latestEmail.body || latestEmail.textExcerpt;
    if (!emailBody) {
      return NextResponse.json({ message: 'No email content found' }, { status: 200 });
    }

    const cleanEmailContent = (str: string) => {
      return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    };

    const cleanedEmailContent = cleanEmailContent(emailBody);
    console.log("LATEST EMAIL: " + cleanedEmailContent);

    let verificationData = await getGroqChatCompletion(cleanedEmailContent);
    verificationData = verificationData != null ? extractJsonFromResponse(verificationData) : {};

    await tempEmailService.deleteInbox(inboxId);
    console.log("verificationData: " + JSON.stringify(verificationData));
    return NextResponse.json(verificationData);
  } catch (error: any) {
    console.error("Error in get-verification-data endpoint:", error);
    return NextResponse.json({ error: `Error fetching email: ${error.message}` }, { status: 500 });
  }
}

async function pollForEmail(inboxId: string, timeout: number, interval: number) {
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    try {
      console.log(`Polling for email in inbox: ${inboxId}`);
      const email = await tempEmailService.getLatestEmail(inboxId, interval);
      if (email) {
        console.log('Email found:', email);
        return email;
      } else {
        console.log('No email found, retrying...');
      }
    } catch (error: any) {
      console.error('Error while polling for email:', error.message);
      if (!error.message.includes('No email yet')) {
        throw error;
      }
    }
    await new Promise(res => setTimeout(res, interval));
  }

  console.log('Polling timed out without finding an email.');
  return null;
}

async function getGroqChatCompletion(text: string) {
  console.log(text);

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Extract and return only the verification code or magic link from this email body. Return the code or link in the following JSON format: {"code": "your_code_here"} or {"link": "your_link_here"}. Do not include any additional text or characters.

Examples:

1. Email Body: Verification code: 7108
   Output: {"code": "7108"}

2. Email Body: Click the following link to verify your account: https://example.com/verify?token=abcd1234
   Output: {"link": "https://example.com/verify?token=abcd1234"}

3. Email Body: Use code ABCD-1234 to continue.
   Output: {"code": "ABCD-1234"}

Unacceptable Responses:
- The verification code is: 7108
- Here is your verification code: 5678
- Click the following link to verify your account: https://example.com/verify?token=abcd1234
- The code is 1234.

Given Email Body: ${text}

Return only the extracted verification code or link in the specified JSON format.`,
        },
      ],
      model: "llama3-8b-8192",
    });

    console.log("GROQ OUTPUT: " + JSON.stringify(response));

    return response.choices[0].message.content?.trim();
  } catch (error: any) {
    throw new Error(`Failed to get verification data from Groq: ${error.message}`);
  }
}

function extractJsonFromResponse(responseText: string) {
  const jsonMatch = responseText.match(/{.*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Failed to extract JSON from response text');
}
