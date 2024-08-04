'use server'

import { Metadata } from 'next';
import { createClient } from '../../../utils/supabase/server';
import LandingClient from './client';

export const metadata: Metadata = {
  title: "PhantomSign | Throwaway emails",
  description: "AI powered throwaway email addresses.",
};

export default async function Landing() {
  const supabase = createClient();
  // const cookieStore = cookies();


  const { data, error } = await supabase.auth.getUser();

  const { data: generatedEmail, error: emailError } = await supabase
        .from("email_statistics")
        .select("generated_emails_count, codes_found_count, links_found_count")
        .eq("id", 1)
        .single();

  return <LandingClient user={data.user} emailStats={generatedEmail}/>;
}
