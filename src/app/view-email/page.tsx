'use server'

import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import ViewEmailClient from './client';
import { NextRequest } from 'next/server';
import supabaseServerClient from '../../lib/supabaseServerClient';

export default async function ViewEmail({ searchParams }: { searchParams: { emailId?: string } }) {;

  const { data: emailContent, error: emailError } = await supabaseServerClient
        .from("incoming_emails")
        .select("*")
        .eq("id", searchParams.emailId)
        .single();

  return <ViewEmailClient emailContent={emailContent} />;
}
