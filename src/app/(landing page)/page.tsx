'use server'

import { createClient } from '../../../utils/supabase/server';
import LandingClient from './client';

export default async function Landing() {
  const supabase = createClient();
  // const cookieStore = cookies();

  const { data, error } = await supabase.auth.getUser();

  return <LandingClient user={data.user} />;
}
