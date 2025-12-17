// In the Name of God, the Creative, the Originator
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames, exclude Payload admin and API routes
  matcher: ['/', '/(fa|en)/:path*', '/((?!api|admin|_next|_vercel|.*\\..*).*)'],
};
