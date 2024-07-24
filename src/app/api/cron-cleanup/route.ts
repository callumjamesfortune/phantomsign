import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';

const DELETE_AFTER_MINUTES = parseInt(process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES!) || 10;
const SECRET_KEY = process.env.SECRET_KEY; // Set this in your Netlify environment variables

const deleteOldEmails = async () => {
  const deleteBefore = Date.now() - (DELETE_AFTER_MINUTES * 60000);

  try {
    // Delete old generated emails
    let { error: generatedEmailsError } = await supabaseServerClient
      .from('generated_emails')
      .delete()
      .lt('created_at', deleteBefore);

    if (generatedEmailsError) {
      console.error('Error deleting old generated emails:', generatedEmailsError);
    } else {
      console.log('Old generated emails deleted successfully');
    }

    // Delete old incoming emails
    let { error: incomingEmailsError } = await supabaseServerClient
      .from('incoming_emails')
      .delete()
      .lt('created_at', deleteBefore);

    if (incomingEmailsError) {
      console.error('Error deleting old incoming emails:', incomingEmailsError);
    } else {
      console.log('Old incoming emails deleted successfully');
    }
  } catch (error) {
    console.error('Error executing delete operation:', error);
  }
};

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  if (key !== SECRET_KEY) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await deleteOldEmails();
  return NextResponse.json({ message: 'Cleanup task completed' });
}
