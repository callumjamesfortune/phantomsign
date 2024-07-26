import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = data.user.id;
  const apiKey = uuidv4(); // Generate a unique and secure API key

  // Hash the API key and truncate to 48 characters
  const saltRounds = 10;
  const hashedApiKey = await bcrypt.hash(apiKey, saltRounds);
  const shortApiKey = hashedApiKey.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48); // Remove non-alphanumeric characters and truncate to 20 characters

  const { error: insertError } = await supabase
    .from('api_keys')
    .insert([{ user_id: userId, api_key: shortApiKey }]);

  if (insertError) {
    return NextResponse.json({ error: 'Error generating API key' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: shortApiKey }, { status: 200 });
}
