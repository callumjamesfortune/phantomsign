import { Logger } from 'next-axiom';
import { NextResponse } from 'next/server';
import { NextFetchEvent, type NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

export async function middleware(request: NextRequest, event: NextFetchEvent) {

  const logger = new Logger({ source: 'middleware' }); // traffic, request

  // Log the request
  logger.middleware(request);

  // Ensure the logs are flushed to Axiom
  event.waitUntil(logger.flush());

  // Update the session before responding
  const response = await updateSession(request);

  // If updateSession returns a response, use it; otherwise, proceed to the next handler
  return response || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
