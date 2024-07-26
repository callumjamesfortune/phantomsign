import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';

export async function DELETE(req: NextRequest) {

  try {
    const { emailAddress } = await req.json();
    if (!emailAddress) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Delete the email from the generated_emails table
    const { error: deleteGeneratedError } = await supabaseServerClient
      .from('generated_emails')
      .delete()
      .eq('email', emailAddress);

    if (deleteGeneratedError) throw deleteGeneratedError;

    // Delete the corresponding emails from the incoming_emails table
    const { error: deleteIncomingError } = await supabaseServerClient
      .from('incoming_emails')
      .delete()
      .eq('email', emailAddress);

    if (deleteIncomingError) throw deleteIncomingError;

    return NextResponse.json({ message: 'Inbox deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
