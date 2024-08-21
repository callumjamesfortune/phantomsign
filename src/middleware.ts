import { Logger } from 'next-axiom';
import { NextResponse } from 'next/server';
import { NextFetchEvent, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest, event: NextFetchEvent) {

  const logger = new Logger({ source: 'middleware' }); // traffic, request

  logger.middleware(request);

  event.waitUntil(logger.flush());

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
};
