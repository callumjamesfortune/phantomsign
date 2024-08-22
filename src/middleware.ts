import { Logger } from 'next-axiom';
import { NextResponse } from 'next/server';
import { NextFetchEvent, type NextRequest } from 'next/server';

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "inspired-camel-42383.upstash.io",
  token: "AaWPAAIjcDE5MmJlNzFjMjBiMGE0NDBmYTc0M2VkZjliYTJkMDE0YnAxMA",
});
 
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

export async function middleware(request: NextRequest, event: NextFetchEvent) {

  const ip = request.ip ?? "127.0.0.1";
  const { success, pending, limit, reset, remaining } =
    await ratelimit.limit(ip);

  if(!success) {
    NextResponse.redirect(new URL("/blocked", request.url));
  } 

  const logger = new Logger({ source: 'middleware' }); // traffic, request

  logger.middleware(request);

  event.waitUntil(logger.flush());

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
};
