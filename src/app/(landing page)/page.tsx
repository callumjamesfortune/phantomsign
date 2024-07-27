'use server'

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '../../../utils/supabase/server';
import DashboardClient from './client';
import LandingClient from './client';

export default async function Dashboard() {
  const supabase = createClient();
  const cookieStore = cookies();

  const { data, error } = await supabase.auth.getUser();

  return <LandingClient user={data.user} />;
}
