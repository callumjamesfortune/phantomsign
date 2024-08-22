import { Logger } from 'next-axiom';
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "https://inspired-camel-42383.upstash.io",
  token: "AaWPAAIjcDE5MmJlNzFjMjBiMGE0NDBmYTc0M2VkZjliYTJkMDE0YnAxMA",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const ip = request.ip ?? "127.0.0.1";
  const rateLimitResponse = await ratelimit.limit(ip);

  // Ensure the rate limiting works correctly
  if (!rateLimitResponse.success) {
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  const logger = new Logger({ source: 'middleware' });
  
  // Log the request
  logger.middleware(request);

  // Ensure all logs are flushed properly
  event.waitUntil(logger.flush());

  // Continue with the request if rate limit is not exceeded
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
};
