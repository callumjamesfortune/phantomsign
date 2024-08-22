import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';
import { validateApiKey } from '../../../lib/apiKeyValidator';
import { cookies } from 'next/headers';
import { Logger } from 'next-axiom';

const log = new Logger();

// Function to generate a random alphanumeric string
function generateEmail(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  // Generate 8 random characters
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

export async function POST(req: NextRequest) {

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} Not Allowed`);
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  const apiKeyValidation = await validateApiKey(req);

  if (!apiKeyValidation.valid) {
    return apiKeyValidation.response;
  }

  const emailString = generateEmail();
  const inbox = `${emailString}@phantomsign.com`;

  try {
    const currentTime = Math.floor(Date.now() / 1000); // Use epoch timestamp for the current time
    const expiryTime = currentTime + (60 * 5)

    const { error: insertError } = await supabaseServerClient
      .from('generated_inboxes')
      .insert([{ email: inbox, created_at: currentTime, expires_at: expiryTime, generated_by: apiKeyValidation.user_id || "Web client" }]);

    if (insertError) {
      console.error(`Insert Error: ${insertError.message}`);
      throw insertError;
    }

    const cookieStore = cookies();
    cookieStore.set({name: 'phantomsign-inbox', value: JSON.stringify({inbox: inbox, expiry: expiryTime})});

    // Increment the generated_inboxes_count in the email_statistics table
    const { data, error: selectError } = await supabaseServerClient
      .from('email_statistics')
      .select('generated_inboxes_count')
      .eq('id', 1)
      .single();

    if (selectError) {
      console.error(`Select Error: ${selectError.message}`);
      throw selectError;
    }

    const newCount = data.generated_inboxes_count + 1;

    const updatedAt = new Date().toISOString(); // Convert epoch to ISO string
    const { error: finalUpdateError } = await supabaseServerClient
      .from('email_statistics')
      .update({ 
        generated_inboxes_count: newCount,
        updated_at: updatedAt
      })
      .eq('id', 1);

    if (finalUpdateError) {
      console.error(`Final Update Error: ${finalUpdateError.message}`);
      throw finalUpdateError;
    }

    log.info('An inbox was generated.', { inbox: inbox });

    return NextResponse.json({ inbox }, { status: 200 });
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
