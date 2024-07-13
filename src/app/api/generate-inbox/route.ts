import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';

// Function to generate a random alphanumeric string
function generateEmail(): string {
  let insideWord = "phantom";
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
  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  const emailString = generateEmail();
  const emailAddress = `${emailString}@phantomsign.com`;

  try {
    const currentTime = Date.now(); // Get current time in milliseconds since epoch

    const { error: insertError } = await supabaseServerClient
      .from('generated_emails')
      .insert([{ email: emailAddress, created_at: currentTime }]);

    if (insertError) throw insertError;

    // Increment the generated_emails_count in the email_statistics table
    const { data, error: selectError } = await supabaseServerClient
      .from('email_statistics')
      .select('generated_emails_count')
      .eq('id', 1)
      .single();

    if (selectError) throw selectError;

    const newCount = data.generated_emails_count + 1;

    const { error: finalUpdateError } = await supabaseServerClient
      .from('email_statistics')
      .update({ 
        generated_emails_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (finalUpdateError) throw finalUpdateError;

    return NextResponse.json({ emailAddress }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
