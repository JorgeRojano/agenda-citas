import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 🔎 Detectar si es ruta admin multi-tenant
  // Ej: /maestra-inclusiva/admin/dashboard
  const isAdminRoute = /^\/[^\/]+\/admin/.test(pathname);

  // 🔎 Detectar login multi-tenant
  // Ej: /maestra-inclusiva/admin/login
  const isLoginRoute = /^\/[^\/]+\/admin\/login$/.test(pathname);

  // Si NO es ruta admin, no hacer nada
  if (!isAdminRoute) {
    return supabaseResponse;
  }

  const segments = pathname.split("/");
  const slug = segments[1]; // primer segmento dinámico

  const url = request.nextUrl.clone();

  // 🛑 CASE 1: No user + intentando entrar a admin
  if (!user && !isLoginRoute) {
    url.pathname = `/${slug}/admin/login`;
    return NextResponse.redirect(url);
  }

  // 🔁 CASE 2: User logueado + intentando entrar a login
  if (user && isLoginRoute) {
    url.pathname = `/${slug}/admin/dashboard`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Solo intercepta rutas tipo:
     * /{slug}/admin/*
     */
    "/:slug/admin/:path*",
  ],
};
