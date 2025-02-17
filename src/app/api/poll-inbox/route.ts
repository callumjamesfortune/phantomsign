import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import Groq from 'groq-sdk';
import sanitizeHtml from 'sanitize-html';
import { validateApiKey } from '../../../lib/apiKeyValidator';
import { Logger } from 'next-axiom';

const log = new Logger();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

const AI_RETRY_LIMIT = 3; // Limit the number of retries for the AI

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

export async function GET(request: NextRequest) {

    const { searchParams } = new URL(request.url);
    const inbox = searchParams.get('inbox');

    if (!inbox) {
        return NextResponse.json({ error: 'No inbox provided' }, { status: 400 });
    }

    // Validate the API key
    const apiKeyValidation = await validateApiKey(request);
    if (!apiKeyValidation.valid) {
        return apiKeyValidation.response;
    }

    try {
        // Fetch the generated email details
        const { data: generatedEmail, error: emailError } = await supabaseServerClient
            .from('generated_inboxes')
            .select('generated_by')
            .eq('email', inbox)
            .single();

        if (emailError || !generatedEmail) {
            return NextResponse.json({ error: 'Inbox not found' }, { status: 404 });
        }

        // Check if the inbox was generated by the same user as the API key or if the request came from the same origin
        if ((apiKeyValidation.user_id && generatedEmail.generated_by !== apiKeyValidation.user_id) && !apiKeyValidation.referrer_valid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const latestEmails = await fetchAllEmails(inbox);
        if (!latestEmails) {
            return NextResponse.json({ message: 'Awaiting email' }, { status: 200 });
        }

        // Check if the email is older than 5 minutes
        // const fiveMinutesAgo = Math.floor(Date.now() / 1000) - Number(process.env.DELETE_AFTER_MINUTES!) * 60;
        // if (latestEmail.created_at < fiveMinutesAgo) {
        //     return NextResponse.json({ error: 'Inbox not found' }, { status: 404 });
        // }

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

        // const cleanedEmailContent = cleanEmailContent(emailBody);

        return NextResponse.json(latestEmails);
    } catch (error: any) {
        console.error("Error in poll-inbox endpoint:", error);
        return NextResponse.json({ error: `Error fetching email: ${error.message}` }, { status: 500 });
    }
}

async function fetchAllEmails(inbox: string) {

    try {
        const { data: emails, error } = await supabaseServerClient
            .from('incoming_emails')
            .select('id, processed_email')
            .eq('email', inbox)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            throw new Error('Error querying Supabase: ' + error.message);
        }

        if (emails && emails.length > 0) {
            return emails;
        } else {
            return null;
        }

    } catch (error: any) {
        console.error('Error while fetching email:', error.message);
        throw error;
    }
    
}
