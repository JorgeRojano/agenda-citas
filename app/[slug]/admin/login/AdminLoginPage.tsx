"use client";

import React, { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { TextInput, PasswordInput, Button, Text } from "@mantine/core";

interface Business {
  name: string;
  primaryColor: string | null;
  logoUrl: string | null;
  description: string | null;
}

interface Props {
  business: Business | null;
}

export default function AdminLoginPage({ business }: Props) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get("error") === "unauthorized";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const primaryColor = business?.primaryColor ?? "#2563eb";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      const errorMessages: Record<string, string> = {
        "Invalid login credentials": "Email o contraseña incorrectos",
        "Email not confirmed": "Debes confirmar tu email antes de iniciar sesión",
        "Too many requests": "Demasiados intentos, espera un momento",
      };
      setErrorMsg(errorMessages[error.message] ?? "Error al iniciar sesión, intenta de nuevo");
      return;
    }

    if (data.user) {
      await supabase.auth.setSession(data.session!);
      await supabase.from("profiles").upsert({ id: data.user.id, email: data.user.email }).eq("id", data.user.id);
      router.refresh();
      window.location.href = `/${slug}/admin/dashboard`;
    }
  }

  return (
    <>
      <style>{`
        .login-wrap {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: row;
        }
        .login-left {
          width: 42%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }
        .login-right {
          flex: 1;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 56px;
        }
        @media (max-width: 640px) {
          .login-wrap {
            flex-direction: column;
          }
          .login-left {
            width: 100%;
            min-height: 240px;
            padding: 40px 24px;
          }
          .login-right {
            padding: 32px 24px 48px;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "white" }}>
        <div className="login-wrap">

          {/* ── LEFT PANEL ── */}
          <div
            className="login-left"
            style={{ background: `linear-gradient(145deg, ${primaryColor}, ${primaryColor}cc)` }}
          >
            {/* Logo */}
            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, zIndex: 1,
              boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
              overflow: "hidden", flexShrink: 0,
            }}>
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span>🏢</span>
              )}
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: "white", zIndex: 1, textAlign: "center" }}>
              {business?.name ?? "Mi Negocio"}
            </div>

            {business?.description && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", zIndex: 1, textAlign: "center" }}>
                {business.description}
              </div>
            )}

            <div style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 11, fontWeight: 600,
              padding: "5px 14px", borderRadius: 99,
              zIndex: 1,
            }}>
              Panel de administración
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="login-right">
            <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Bienvenido
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 32 }}>
                Inicia sesión para gestionar tus citas
              </div>

              {isUnauthorized && (
                <Text c="red" size="sm" mb="md">
                  No tienes acceso a este negocio
                </Text>
              )}

              {errorMsg && (
                <Text c="red" size="sm" mb="md">
                  {errorMsg}
                </Text>
              )}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <TextInput
                  label="Email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <PasswordInput
                  label="Contraseña"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  style={{ backgroundColor: primaryColor, marginTop: 4 }}
                >
                  Entrar
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}