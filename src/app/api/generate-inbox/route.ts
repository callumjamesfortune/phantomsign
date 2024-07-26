import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';

// Function to generate a random alphanumeric string
function generateEmail(): string {
  const insideWord = "phantom";
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Intersperse letters of 'phantom' between the random characters
  let finalResult = '';
  for (let i = 0; i < 8; i++) {
    finalResult += result[i];
    if (i < insideWord.length) {
      finalResult += insideWord[i];
    }
  }

  // Add the remaining letters of 'phantom' if there are any
  if (insideWord.length > 8) {
    finalResult += insideWord.slice(8);
  }

  return finalResult;
}

export async function POST(req: NextRequest) {
  console.log('Received request:', req.method);

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} Not Allowed`);
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  const referrer = req.headers.get('referer');
  const host = req.headers.get('host') || "";

  // Allow requests from the same host or those with a valid API key
  const apiKey = req.headers.get('x-api-key');
  if (!referrer?.includes(host) && !apiKey) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 401 });
  }

  // Validate the API key if present
  if (apiKey) {
    const { data: apiKeyData, error: apiKeyError } = await supabaseServerClient
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (apiKeyError || !apiKeyData) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  }

  const emailString = generateEmail();
  const emailAddress = `${emailString}@phantomsign.com`;

  console.log(`Generated email address: ${emailAddress}`);

  try {
    const currentTime = Date.now(); // Get current time in milliseconds since epoch
    console.log(`Current Time (ms since epoch): ${currentTime}`);

    const { error: insertError } = await supabaseServerClient
      .from('generated_emails')
      .insert([{ email: emailAddress, created_at: currentTime }]);

    if (insertError) {
      console.error(`Insert Error: ${insertError.message}`);
      throw insertError;
    }

    console.log(`Inserted email address: ${emailAddress}`);

    // Increment the generated_emails_count in the email_statistics table
    const { data, error: selectError } = await supabaseServerClient
      .from('email_statistics')
      .select('generated_emails_count')
      .eq('id', 1)
      .single();

    if (selectError) {
      console.error(`Select Error: ${selectError.message}`);
      throw selectError;
    }

    const newCount = data.generated_emails_count + 1;
    console.log(`New Generated Emails Count: ${newCount}`);

    const { error: finalUpdateError } = await supabaseServerClient
      .from('email_statistics')
      .update({ 
        generated_emails_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (finalUpdateError) {
      console.error(`Final Update Error: ${finalUpdateError.message}`);
      throw finalUpdateError;
    }

    console.log(`Updated email_statistics count to: ${newCount}`);

    return NextResponse.json({ emailAddress }, { status: 200 });
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
