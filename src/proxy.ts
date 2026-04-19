import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware assainissement — la vérification d'auth est gérée côté client
 * par AssainissementLayoutClient (qui envoie les cookies cross-origin via
 * credentials: 'include'). Le middleware serveur ne peut pas accéder au
 * cookie PHPSESSID car il est sur le domaine mpako.net, pas payfisc.vercel.app.
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: '/activity/assainissement/:path*',
};
