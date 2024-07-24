import { schedule } from '@netlify/functions';
import supabaseServerClient from '../../src/lib/supabaseServerClient';

const DELETE_AFTER_MINUTES = parseInt(process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES) || 10;

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

export const handler = schedule('*/5 * * * *', async (event, context) => {
  await deleteOldEmails();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Cleanup task completed' }),
  };
});
