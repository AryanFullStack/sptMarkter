import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({
            name,
            value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // Use getUser() instead of getSession() for security
  let user = null;
  
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    
    // Only log non-session-missing errors
    if (error && error.name !== 'AuthSessionMissingError') {
      console.error('Auth error:', error)
    }
    
    user = authUser;
  } catch (err: any) {
    // Silently handle auth errors during logout/session transitions
    if (err?.name !== 'AuthSessionMissingError') {
      console.error('Auth check error:', err)
    }
  }

  // Role-based redirects after successful authentication
  if (user && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    // Fetch user role from database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role) {
      const role = userData.role
      
      // Redirect to appropriate dashboard based on role - separate for admin and sub-admin
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else if (role === 'sub_admin') {
        return NextResponse.redirect(new URL('/sub-admin', req.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }

  // Add specific headers to prevent caching of protected routes and ensure latest auth state
  if (!res.headers.get('Cache-Control')) {
    res.headers.set('Cache-Control', 'no-store, must-revalidate');
  }

  return res
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
