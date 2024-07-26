import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: 'Error logging out' }, { status: 500 });
  }

  // Clear Supabase session cookies
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.set('sb-access-token', '', { path: '/', expires: new Date(0) });
  response.cookies.set('sb-refresh-token', '', { path: '/', expires: new Date(0) });

  return response;
}
