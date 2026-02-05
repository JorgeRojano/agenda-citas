"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr"; // Import this!
import { TextInput, PasswordInput, Button, Box, Title, Paper } from "@mantine/core";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize the browser client here
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin() {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert("Error: " + error.message);
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
    <Box maw={400} mx="auto" mt={100}>
      <Paper shadow="xs" p="xl" withBorder>
        <Title order={3} mb="md">Admin Login</Title>
        <TextInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} mb="sm" />
        <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.target.value)} mb="md" />
        <Button fullWidth loading={loading} onClick={handleLogin}>Entrar</Button>
      </Paper>
    </Box>
  );
}