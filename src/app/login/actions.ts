'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function loginOrSignUp(formData: FormData) {
  const supabase = createClient();

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

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return NextResponse.json({ error: 'Signup failed' }, { status: 400 });
    }
  }

  revalidatePath('/dashboard');
  return NextResponse.json({ success: true }, { status: 200 });
}
