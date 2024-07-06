import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import Groq from 'groq-sdk';
import sanitizeHtml from 'sanitize-html';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

const POLLING_INTERVAL = 2000; // 2 seconds
const POLLING_TIMEOUT = 120000; // 120 seconds
const AI_RETRY_LIMIT = 2; // Limit the number of retries for the AI

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

        const emailBody = latestEmail.body;
        if (!emailBody) {
            return NextResponse.json({ message: 'No email content found' }, { status: 200 });
        }

        const cleanEmailContent = (str: string) => {
            return sanitizeHtml(str, {
                allowedTags: ['a'], // Keep only <a> tags
                allowedAttributes: {
                    'a': ['href'] // Keep only href attribute in <a> tags
                },
                transformTags: {
                    'a': sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
                }
            }).replace(/\s+/g, ' ').trim();
        };

        const cleanedEmailContent = cleanEmailContent(emailBody);
        console.log("LATEST EMAIL: " + cleanedEmailContent);

        let verificationData = await getVerificationDataWithRetry(cleanedEmailContent, AI_RETRY_LIMIT);

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
            const { data: emails, error } = await supabaseServerClient
                .from('incoming_emails')
                .select('*')
                .eq('email', inboxId)
                .order('received_at', { ascending: false })
                .limit(1);

            if (error) {
                throw new Error('Error querying Supabase: ' + error.message);
            }

            if (emails && emails.length > 0) {
                const email = emails[0];
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
                    content: `Extract and return only the verification code or magic link from this email body. Specifically look for text and href attributes in <a> tags and ensure that the entire URL is selected if it is a link. Ensure that the email address itself is not mistakenly selected as the verification code. Return the code or link and the company name in the following JSON format: {"code": "your_code_here", "company": "company_name_here"} or {"link": "your_link_here", "company": "company_name_here"}. Do not include any additional text or characters.

Examples:

1. Email Body: Verification code: 7108 from ExampleCorp
   Output: {"code": "7108", "company": "ExampleCorp"}

2. Email Body: Click the following link to verify your account: <a href="https://example.com/verify?token=abcd1234">Verify</a>. Sent by ExampleCorp.
   Output: {"link": "https://example.com/verify?token=abcd1234", "company": "ExampleCorp"}

3. Email Body: Use code ABCD-1234 to continue. From ExampleCorp.
   Output: {"code": "ABCD-1234", "company": "ExampleCorp"}

Unacceptable Responses:
- The verification code is: 7108 from ExampleCorp
- Here is your verification code: 5678. Sent by ExampleCorp.
- Click the following link to verify your account: https://example.com/verify?token=abcd1234. From ExampleCorp
- The code is 1234 from ExampleCorp.
- Email address itself is selected as the verification code.
- Only part of the URL is selected as the code.

Given Email Body: ${text}

Return only the extracted verification code or link and the company name in the specified JSON format.`,
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

async function getVerificationDataWithRetry(text: string, retries: number) {
    let attempts = 0;
    let verificationData = null;

    while (attempts < retries && !verificationData) {
        attempts++;
        console.log(`Attempt ${attempts} to get verification data from AI`);
        try {
            const response = await getGroqChatCompletion(text);
            verificationData = response != null ? extractJsonFromResponse(response) : null;
        } catch (error: any) {
            console.error(`Error on attempt ${attempts}: ${error.message}`);
            if (attempts >= retries) {
                throw new Error('Max retry attempts reached.');
            }
        }
    }

    if (!verificationData) {
        throw new Error('Failed to extract verification data after multiple attempts.');
    }

    return verificationData;
}

function extractJsonFromResponse(responseText: string) {
    const jsonMatch = responseText.match(/{.*}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to extract JSON from response text');
}
