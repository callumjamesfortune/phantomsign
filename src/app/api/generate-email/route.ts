import { NextRequest, NextResponse } from 'next/server';
import supabase from '../../../lib/supabaseClient';

// Function to generate a random alphanumeric string
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to intersperse 'phantom' in the random string
function interspersePhantom(randomString: string): string {
  const insertion = 'phantom';
  let result = '';
  for (let i = 0; i < randomString.length; i++) {
    result += randomString[i];
    if ((i + 1) % 2 === 0 && insertion) {
      result += insertion[Math.floor(i / 2) % insertion.length];
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  const randomString = generateRandomString(12); // Adjust the length as needed
  const emailLocalPart = interspersePhantom(randomString);
  const emailAddress = `${emailLocalPart}@seefortune.co.uk`;

  try {
    const { data, error } = await supabase
      .from('generated_emails')
      .insert([{ email: emailAddress }]);

    if (error) throw error;

    return NextResponse.json({ emailAddress }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
