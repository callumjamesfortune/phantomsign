import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const action = formData.get('action')?.toString();

  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
  }

  if (action === 'login') {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: 'Login failed' }, { status: 400 });
    }
  } else if (action === 'signup') {
    const localPart = email.split('@')[0];
    const containsAllLetters = /(?=.*p)(?=.*h)(?=.*a)(?=.*n)(?=.*t)(?=.*o)(?=.*m)/.test(localPart);
    if (containsAllLetters) {
      return NextResponse.json({ error: 'Email cannot contain the letters "phantom"' }, { status: 400 });
    }

    const { error } = await supabase.auth.signUp({ email: email, password: password });
    if (error) {
      return NextResponse.json({ error: 'Signup failed' }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
