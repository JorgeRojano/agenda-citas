"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr"; // Import this!
import { TextInput, PasswordInput, Button, Box, Title, Paper, Stack, Text, Anchor } from "@mantine/core";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize the browser client here
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
      // 1. Force the browser to save cookies
      await supabase.auth.setSession(data.session!);

      // 2. Refresh the router to prepare Next.js
      router.refresh();

      // 3. HARD REDIRECT
      // Standard router.push often fails to send new cookies to middleware.
      // window.location.href forces the browser to send the new headers.
      window.location.href = "/admin/dashboard";
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
      <Paper withBorder radius="md" p="0" style={{ width: "100%", maxWidth: 900, height: "100%" }} shadow="xs">
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 420,
          }}
        >
          {/* Left: image/icon pane */}
          <Box
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <img src="/email-icon.svg" alt="Email icon" style={{ width: "60%", maxWidth: 240, height: "auto" }} />
          </Box>

          {/* Right: form pane */}
          <Box style={{ flex: 1, padding: "1.5rem" }}>
            <form onSubmit={handleLogin} aria-busy={loading}>
              <Stack gap="sm">
                <div>
                  <Title order={4}>Admin Login</Title>
                  <Text size="sm" color="dimmed">Sign in to manage appointments</Text>
                </div>

                {errorMsg && (
                  <Text color="red" size="sm" role="alert">
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

                <Button type="submit" fullWidth loading={loading} aria-label="Sign in">
                  Entrar
                </Button>

                <div style={{ textAlign: "center" }}>
                  <Anchor href="/admin/forgot" size="sm">
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
