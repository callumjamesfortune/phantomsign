// utils/apiKeyValidator.ts
import supabaseServerClient from './supabaseServerClient';
import { NextRequest, NextResponse } from 'next/server';

export async function validateApiKey(req: NextRequest): Promise<{ valid: boolean, response?: NextResponse, user_id?: string, referrer_valid?: boolean }> {
  const referrer = req.headers.get('referer');
  const host = req.headers.get('host') || "";
  const apiKey = req.headers.get('x-api-key');

  const referrerValid = referrer?.includes(host) ?? false;

  if (!referrerValid && !apiKey) {
    return { valid: false, response: NextResponse.json({ error: 'API key is missing' }, { status: 401 }) };
  }

  if (apiKey) {
    const { data: apiKeyData, error: apiKeyError } = await supabaseServerClient
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .or(`expires_at.is.null,expires_at.gte.${Math.floor(Date.now() / 1000)}`) // Ensure the key is not expired or has no expiry
      .single();

    if (apiKeyError || !apiKeyData) {
      return { valid: false, response: NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 }) };
    }

    return { valid: true, user_id: apiKeyData.user_id, referrer_valid: referrerValid };
  }

  return { valid: true, user_id: undefined, referrer_valid: referrerValid };
}
