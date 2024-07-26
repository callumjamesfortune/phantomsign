// src/app/actions.ts

'use server';

import { createClient } from '../../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function generateApiKey(formData: FormData) {
  const supabase = createClient();
  const description = formData.get('description')?.toString() || '';

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error('Unauthorized');
  }

  const userId = data.user.id;
  const apiKey = generateRandomString(20); // Generate a unique and secure API key

  const { data: insertData, error: insertError } = await supabase
    .from('api_keys')
    .insert([{ user_id: userId, api_key: apiKey, description }])
    .select();

  if (insertError) {
    throw new Error('Error generating API key');
  }

  revalidatePath('/dashboard');
  return { id: insertData[0].id, apiKey, description };
}

export async function deleteApiKey(apiKeyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error('Unauthorized');
  }

  const { error: deleteError } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', apiKeyId);

  if (deleteError) {
    throw new Error('Error deleting API key');
  }

  revalidatePath('/dashboard');
}

// Helper function to generate a random alphanumeric string
function generateRandomString(length = 48) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
