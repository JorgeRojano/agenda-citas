import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Create an initial response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Initialize the Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update request cookies for the current execution
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Re-initialize the response to carry the new headers
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Update response cookies for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Get the user (getUser is safer than getSession)
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isLoginPage = url.pathname === '/admin/login'

  // CASE 1: No user + trying to access admin pages -> Go to Login
  if (!user && !isLoginPage) {
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // CASE 2: User is logged in + trying to access login page -> Go to Dashboard
  if (user && isLoginPage) {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
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
    '/admin/:path*',
  ],
}