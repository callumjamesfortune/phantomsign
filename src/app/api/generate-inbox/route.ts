import { NextRequest, NextResponse } from 'next/server';
import TempEmailService from 'src/lib/temp-email-service';

const apiKey = process.env.MAILSLURP_API_KEY as string;
const tempEmailService = new TempEmailService(apiKey);

export async function POST(request: NextRequest) {
  try {
    const inbox = await tempEmailService.createInbox();
    return NextResponse.json({ inboxId: inbox.id, emailAddress: inbox.emailAddress });
  } catch (error: any) {
    return NextResponse.json({ error: `Error creating inbox: ${error.message}` }, { status: 500 });
  }
}
