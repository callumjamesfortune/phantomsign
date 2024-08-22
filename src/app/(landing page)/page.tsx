'use server'

import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import LandingClient from './client';

export default async function Landing() {
  const supabase = createClient();
  // const cookieStore = cookies();


  const { data, error } = await supabase.auth.getUser();

  const { data: generatedEmail, error: emailError } = await supabase
        .from("email_statistics")
        .select("generated_inboxes_count, codes_found_count, links_found_count")
        .eq("id", 1)
        .single();

  const cookieStore = cookies();
  let inboxCookie = cookieStore.get('phantomsign-inbox');
  let inboxFromCookie = inboxCookie?.value || null;

  return <LandingClient user={data.user} emailStats={generatedEmail} inboxFromCookie={inboxFromCookie}/>;
}
