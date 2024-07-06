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

export async function POST(request: NextRequest) {
  const emailString = generateEmail(); // Adjust the length as needed
  const emailAddress = `${emailString}@seefortune.co.uk`;

  try {
    const { error } = await supabaseServerClient
      .from('generated_emails')
      .insert([{ email: emailAddress }]);

    if (error) throw error;

    return NextResponse.json({ emailAddress }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
