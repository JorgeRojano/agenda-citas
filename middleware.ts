import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  const isAdminRoute = /^\/[^\/]+\/admin/.test(pathname);
  const isLoginRoute = /^\/[^\/]+\/admin\/login$/.test(pathname);

  if (!isAdminRoute) return supabaseResponse;

  const slugInUrl = pathname.split("/")[1];

  // ── Supabase client que propaga cookies correctamente ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // CASE 1: No session → redirect to login
  if (!user && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${slugInUrl}/admin/login`;
    return NextResponse.redirect(loginUrl);
  }

  if (!user) return supabaseResponse;

  // Fetch profile and business in parallel using service role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [{ data: profile }, { data: businessInUrl }] = await Promise.all([
    supabaseAdmin.from("profiles").select("role, businessId").eq("id", user.id).maybeSingle(),
    supabaseAdmin.from("Business").select("id").eq("slug", slugInUrl).maybeSingle(),
  ]);

  const isSuperAdmin = profile?.role === "SUPER_ADMIN";
  if (isSuperAdmin) return supabaseResponse;

  const ownsThisBusiness = profile?.businessId === businessInUrl?.id;

  // CASE 2: Logged in, not login route → validate ownership
  if (!isLoginRoute && !ownsThisBusiness) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${slugInUrl}/admin/login`;
    loginUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(loginUrl);
  }

  // CASE 3: Logged in, on login route → redirect to dashboard if owns business
  if (isLoginRoute) {
    if (ownsThisBusiness) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = `/${slugInUrl}/admin/dashboard`;
      return NextResponse.redirect(dashUrl);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/:slug/admin/:path*"],
};