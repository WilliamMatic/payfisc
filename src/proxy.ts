import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost/Impot/Front/payfisc/backend/calls';

export async function proxy(request: NextRequest) {
  // Forward PHP session cookies to the backend to check the session
  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const res = await fetch(`${API_BASE_URL}/auth/check_any_session.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    });

    const session = await res.json();

    // Must be an authenticated utilisateur (not agent)
    if (
      session.status === 'success' &&
      session.userType === 'utilisateur' &&
      session.data?.utilisateur
    ) {
      const privilegesRaw = session.data.utilisateur.privileges_include;
      let privileges: Record<string, Record<string, boolean>> | null = null;

      if (typeof privilegesRaw === 'string') {
        try {
          privileges = JSON.parse(privilegesRaw);
        } catch {
          privileges = null;
        }
      } else if (privilegesRaw && typeof privilegesRaw === 'object') {
        privileges = privilegesRaw;
      }

      const isAdmin = privileges?.assainissement?.admin === true;

      if (isAdmin) {
        return NextResponse.next();
      }
    }

    // Not authorised — redirect to login with feedback
    const loginUrl = new URL('/system/login', request.url);
    loginUrl.searchParams.set('error', 'Accès refusé');
    return NextResponse.redirect(loginUrl);
  } catch {
    // Backend unreachable — let the client-side handle it
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/activity/assainissement/:path*',
};
