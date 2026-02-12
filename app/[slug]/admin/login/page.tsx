"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  TextInput,
  PasswordInput,
  Button,
  Box,
  Title,
  Paper,
  Stack,
  Text,
  Anchor,
} from "@mantine/core";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string; // 👈 importante

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      await supabase.auth.setSession(data.session!);

      router.refresh();

      // ✅ Redirigir con slug dinámico
      window.location.href = `/${slug}/admin/dashboard`;
    }
  }

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Paper
        withBorder
        radius="md"
        p="0"
        style={{ width: "100%", maxWidth: 900 }}
        shadow="xs"
      >
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 420,
          }}
        >
          <Box
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <img
              src="/email-icon.svg"
              alt="Email icon"
              style={{ width: "60%", maxWidth: 240 }}
            />
          </Box>

          <Box style={{ flex: 1, padding: "1.5rem" }}>
            <form onSubmit={handleLogin}>
              <Stack gap="sm">
                <div>
                  <Title order={4}>Admin Login</Title>
                  <Text size="sm" c="dimmed">
                    Sign in to manage appointments
                  </Text>
                </div>

                {errorMsg && (
                  <Text c="red" size="sm">
                    {errorMsg}
                  </Text>
                )}

                <TextInput
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button type="submit" fullWidth loading={loading}>
                  Entrar
                </Button>

                <div style={{ textAlign: "center" }}>
                  <Anchor href={`/${slug}/admin/forgot`} size="sm">
                    Forgot password?
                  </Anchor>
                </div>
              </Stack>
            </form>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
