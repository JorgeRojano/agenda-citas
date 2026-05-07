"use client";

import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState("");

  const handleRefresh = () => {
    router.refresh();
    const now = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLastUpdated(now);
  };

  // Establecer la hora inicial al cargar
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }));
  }, []);

  return (
    <Group gap="xs">
      {lastUpdated && (
        <Text size="xs" c="dimmed">
          Actualizado: {lastUpdated}
        </Text>
      )}
      <Tooltip label="Refrescar datos">
        <ActionIcon 
          variant="light" 
          color="blue" 
          onClick={handleRefresh}
          size="lg"
        >
          <IconRefresh size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}