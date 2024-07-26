import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = data.user.id;
  const apiKey = uuidv4(); // Generate a unique API key

  const { error: insertError } = await supabase
    .from('api_keys')
    .insert([{ user_id: userId, api_key: apiKey }]);

  if (insertError) {
    return NextResponse.json({ error: 'Error generating API key' }, { status: 500 });
  }

  return NextResponse.json({ apiKey }, { status: 200 });
}
