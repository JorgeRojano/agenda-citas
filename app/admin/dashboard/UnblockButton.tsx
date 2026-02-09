"use client";

import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  blockId: string;
};

export default function UnblockButton({ blockId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnblock() {
    const confirmed = confirm("¿Seguro que deseas quitar este bloqueo?");
    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/availability/${blockId}`, {
        method: "DELETE",
      });

      console.log("Response from unblock API:", res);

      if (!res.ok) {
        throw new Error("Error al quitar bloqueo");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("No se pudo quitar el bloqueo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="xs"
      color="red"
      variant="light"
      onClick={handleUnblock}
      loading={loading}
      mt="sm"
    >
      Quitar bloqueo
    </Button>
  );
}
