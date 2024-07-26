// src/app/actions/logout.ts
'use server';

import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error);
    return { error: 'Error logging out' };
  }

  // Clear the Supabase session cookies
  return redirect('/');
}
