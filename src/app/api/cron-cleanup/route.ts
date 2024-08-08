import { NextRequest, NextResponse } from 'next/server';
import supabaseServerClient from '../../../lib/supabaseServerClient';

const DELETE_AFTER_MINUTES = parseInt(process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES!) || 10;
const CRON_SECRET = process.env.CRON_SECRET; // Set this in your Vercel environment variables

const deleteOldEmails = async () => {
  const deleteBefore = Math.floor(Date.now() / 1000) - (DELETE_AFTER_MINUTES * 60);

  try {
    // Delete old generated emails
    let { error: generatedEmailsError } = await supabaseServerClient
      .from('generated_inboxes')
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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await deleteOldEmails();
  return NextResponse.json({ message: 'Cleanup task completed' });
}
