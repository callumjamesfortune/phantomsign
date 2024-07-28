'use server';

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

  const { data: apiKeys, error: apiKeysError } = await supabase
    .from('api_keys')
    .select('id, api_key, description, expires_at, usage_count, last_used')
    .eq('user_id', data.user.id);

  if (apiKeysError) {
    console.error('Error fetching API keys:', apiKeysError.message);
    // Handle error appropriately, maybe redirect to an error page
  }

  return <KeysClient user={data.user} initialApiKeys={apiKeys || []} />;
}
