import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Auth middleware — runs on every request.
 *
 * • Refreshes the Supabase session cookie (keeps "sticky login" alive).
 * • Redirects unauthenticated visitors away from protected routes.
 * • Redirects already-logged-in users away from /login and /signup.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // First push updates back into the request (required by Supabase SSR)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Rebuild the response so the updated cookies go to the browser
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() — not getSession() — is required here.
  // getSession() only reads the cookie; getUser() validates the token with
  // Supabase's servers, preventing spoofed cookie attacks.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  // Unauthenticated user trying to access a protected route
  if (!user && !isAuthPage && pathname !== '/') {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Already logged-in user hitting login/signup → send straight to board
  if (user && isAuthPage) {
    const boardUrl = request.nextUrl.clone()
    boardUrl.pathname = '/board'
    return NextResponse.redirect(boardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *   • _next/static (static files)
     *   • _next/image (image optimisation)
     *   • favicon.ico
     *   • common image extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
