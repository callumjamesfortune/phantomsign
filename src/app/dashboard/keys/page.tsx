'use server'

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '../../../../utils/supabase/server';
import KeysClient from './client';

export default async function Dashboard() {
  const supabase = createClient();
  const cookieStore = cookies();

  const { data, error } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect('/login');
  }

  return <KeysClient user={data.user} />;
}
