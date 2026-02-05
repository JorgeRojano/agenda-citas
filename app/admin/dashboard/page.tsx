"use client";

import { supabase } from "@/lib/supabaseClient";
import { Title, Box, Button } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <Box p="md">
      <Title order={2}>Panel del Estilista</Title>

      <Button mt="md" onClick={logout}>
        Cerrar sesión
      </Button>
    </Box>
  );
}
