'use server'

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '../../../utils/supabase/server';
import DashboardClient from './client';

export default async function Dashboard() {
  const supabase = createClient();
  const cookieStore = cookies();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect('/login');
  }

  const { data: apiKeysData, error: apiKeysError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', data.user.id);

  if (apiKeysError) {
    console.error('Error fetching API keys:', apiKeysError);
  }

  const apiKeys = apiKeysData?.map((item: { api_key: string }) => item.api_key) || [];

  return <DashboardClient user={data.user} initialApiKeys={apiKeys} />;
}
