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
  limiter: Ratelimit.slidingWindow(parseInt(process.env.NEXT_PUBLIC_RATE_LIMIT!), "60 s"),
});

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const ip = request.ip ?? "localhost:3000";
  if(ip != "localhost:3000") {
    const rateLimitResponse = await ratelimit.limit(ip);

     // Ensure the rate limiting works correctly
    if (!rateLimitResponse.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
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
