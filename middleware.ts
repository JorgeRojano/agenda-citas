import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// La gestión de módulos la hace el SUPER_ADMIN en Supabase Table Editor → BusinessModule.
// Este mapa solo define qué rutas requieren qué módulo activo para poder acceder.
const MODULE_ROUTES: Record<string, string> = {
  "/book": "appointments",
  "/menu": "digital-menu",
  "/admin/menu": "digital-menu",
};

function getRequiredModule(pathname: string): string | null {
  for (const [route, key] of Object.entries(MODULE_ROUTES)) {
    if (new RegExp(`^/[^/]+${route}(/|$)`).test(pathname)) return key;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const slugInUrl = pathname.split("/")[1];

  const isAdminRoute = /^\/[^\/]+\/admin/.test(pathname);
  const isLoginRoute = /^\/[^\/]+\/admin\/login$/.test(pathname);
  const requiredModule = getRequiredModule(pathname);

  if (!isAdminRoute && !requiredModule) return supabaseResponse;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── Rutas de admin: autenticación + ownership + módulo ──
  if (isAdminRoute) {
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

    if (!user && !isLoginRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${slugInUrl}/admin/login`;
      return NextResponse.redirect(loginUrl);
    }

    if (!user) return supabaseResponse;

    const [{ data: profile }, { data: businessInUrl }] = await Promise.all([
      supabaseAdmin.from("profiles").select("role, businessId").eq("id", user.id).maybeSingle(),
      supabaseAdmin.from("Business").select("id").eq("slug", slugInUrl).maybeSingle(),
    ]);

    const isSuperAdmin = profile?.role === "SUPER_ADMIN";
    if (isSuperAdmin) return supabaseResponse;

    const ownsThisBusiness = profile?.businessId === businessInUrl?.id;

    if (!isLoginRoute && !ownsThisBusiness) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${slugInUrl}/admin/login`;
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    if (isLoginRoute) {
      if (ownsThisBusiness) {
        const dashUrl = request.nextUrl.clone();
        dashUrl.pathname = `/${slugInUrl}/admin/appointments/dashboard`;
        return NextResponse.redirect(dashUrl);
      }
      return supabaseResponse;
    }

    // Verificar módulo requerido para rutas admin (ej. /admin/menu)
    if (requiredModule && businessInUrl) {
      const { data: mod } = await supabaseAdmin
        .from("BusinessModule")
        .select("isActive")
        .eq("businessId", businessInUrl.id)
        .eq("moduleKey", requiredModule)
        .maybeSingle();

      if (!mod?.isActive) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = `/${slugInUrl}`;
        homeUrl.searchParams.set("error", "modulo-inactivo");
        return NextResponse.redirect(homeUrl);
      }
    }

    return supabaseResponse;
  }

  // ── Rutas públicas con módulo requerido (ej. /book, /menu) ──
  if (requiredModule) {
    const { data: businessInUrl } = await supabaseAdmin
      .from("Business")
      .select("id")
      .eq("slug", slugInUrl)
      .maybeSingle();

    if (!businessInUrl) return supabaseResponse;

    const { data: mod } = await supabaseAdmin
      .from("BusinessModule")
      .select("isActive")
      .eq("businessId", businessInUrl.id)
      .eq("moduleKey", requiredModule)
      .maybeSingle();

    if (!mod?.isActive) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = `/${slugInUrl}`;
      homeUrl.searchParams.set("error", "modulo-inactivo");
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/:slug/admin/:path*",
    "/:slug/book/:path*",
    "/:slug/menu/:path*",
  ],
};
