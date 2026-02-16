import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./lib/supabaseServer";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isAdminRoute = /^\/[^\/]+\/admin/.test(pathname);
  const isLoginRoute = /^\/[^\/]+\/admin\/login$/.test(pathname);

  if (!isAdminRoute) return supabaseResponse;

  const segments = pathname.split("/");
  const slugInUrl = segments[1]; 

  // 🛑 CASE 1: No hay usuario -> Login del negocio actual
  if (!user && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${slugInUrl}/admin/login`;
    return NextResponse.redirect(loginUrl);
  }

  // 🔐 CASE 2: Usuario logueado -> Validar permisos
  if (user && !isLoginRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, businessId")
      .eq("id", user.id)
      .maybeSingle();

    const isSuperAdmin = profile?.role === "SUPER_ADMIN";

    // Si eres SuperAdmin, te dejamos pasar a cualquier slug
    if (isSuperAdmin) return supabaseResponse;

    // Si eres Admin normal, verificamos el ID del negocio del SLUG actual
    const { data: businessInUrl } = await supabase
      .from("business")
      .select("id")
      .eq("slug", slugInUrl)
      .maybeSingle();

    const ownsThisBusiness = profile?.businessId === businessInUrl?.id;

    if (!ownsThisBusiness) {
      const redirectUrl = request.nextUrl.clone();

      if (profile?.businessId) {
        // Buscamos el slug real del negocio que sí posee el usuario
        const { data: ownBusiness } = await supabase
          .from("business")
          .select("slug")
          .eq("id", profile.businessId)
          .maybeSingle();

        // Validamos que ownBusiness y slug existan para evitar "undefined"
        if (ownBusiness?.slug) {
          const correctPath = `/${ownBusiness.slug}/admin/dashboard`;
          
          // 🛡️ CONTROL DE BUCLE: Solo redirigir si no estamos ya ahí
          if (pathname !== correctPath) {
            redirectUrl.pathname = correctPath;
            return NextResponse.redirect(redirectUrl);
          }
        }
      } else {
        // Si el usuario no tiene negocio asignado y no es SuperAdmin
        redirectUrl.pathname = "/";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 🔁 CASE 3: User logueado intentando entrar al login -> Dashboard
  if (user && isLoginRoute) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = `/${slugInUrl}/admin/dashboard`;
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/:slug/admin/:path*"],
};