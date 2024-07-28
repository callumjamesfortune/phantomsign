// src/app/actions.ts

'use server';

import { createClient } from '../../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function generateApiKey(formData: FormData) {
  const supabase = createClient();
  const description = formData.get('description')?.toString() || '';
  const expiresAt = formData.get('expires_at')?.toString() || '';

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    console.error('Error fetching user:', error);
    throw new Error('Unauthorized');
  }

  const userId = data.user.id;
  const apiKey = generateRandomString(36); // Generate a unique and secure API key

  console.log('Generated API Key:', apiKey);
  console.log('User ID:', userId);
  console.log('Description:', description);
  console.log('Expires At:', expiresAt);

  let expiresAtEpoch: number | null = null;
  if (expiresAt) {
    const expiresAtDate = new Date(expiresAt);
    if (expiresAtDate <= new Date()) {
      console.error('Expiration date must be in the future');
      throw new Error('Expiration date must be in the future');
    }
    expiresAtEpoch = Math.floor(expiresAtDate.getTime() / 1000);
  }

  try {
    const { data: existingKeyData, error: existingKeyError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (existingKeyData) {
      console.error('API Key already exists:', existingKeyData.id);
      throw new Error('API Key already exists');
    }

    if (existingKeyError && existingKeyError.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Error checking existing API key:', existingKeyError);
      throw new Error('Error checking existing API key');
    }

    const { data: insertData, error: insertError } = await supabase
      .from('api_keys')
      .insert([{ user_id: userId, api_key: apiKey, description: description || null, expires_at: expiresAtEpoch }])
      .select();

    if (insertError) {
      console.error('Error inserting API key:', insertError);
      throw insertError;
    }

    console.log('Inserted API Key:', insertData[0]);

    revalidatePath('/dashboard');
    return { id: insertData[0].id, apiKey, description, expiresAt };
  } catch (error: any) {
    console.error('Error generating API key:', error);
    throw new Error(error.message);
  }
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
