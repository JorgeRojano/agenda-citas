"use client";

import {
  Stack,
  Title,
  Divider,
  TextInput,
  Textarea,
  Button,
  Group,
  ColorInput,
  Text,
  Paper,
  Switch,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { showNotification } from "@mantine/notifications";
import { IconDeviceFloppy } from "@tabler/icons-react";

type BusinessSettings = {
  name: string;
  description: string;
  primaryColor: string;
  logoUrl: string;
  bannerUrl: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  website: string;
};

const defaultSettings: BusinessSettings = {
  name: "",
  description: "",
  primaryColor: "#2563eb",
  logoUrl: "",
  bannerUrl: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  website: "",
};

export default function SettingsPage() {
  const { slug } = useParams();
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<BusinessSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  const [isResource, setIsResource] = useState(false);
  const [savedIsResource, setSavedIsResource] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettings) ||
    isResource !== savedIsResource;

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch business settings
      const res = await fetch(`/api/business/${slug}/settings`);
      if (res.ok) {
        const data = await res.json();
        const loaded = {
          name: data.name ?? "",
          description: data.description ?? "",
          primaryColor: data.primaryColor ?? "#2563eb",
          logoUrl: data.logoUrl ?? "",
          bannerUrl: data.bannerUrl ?? "",
          whatsapp: data.whatsapp ?? "",
          instagram: data.instagram ?? "",
          facebook: data.facebook ?? "",
          website: data.website ?? "",
        };
        setSettings(loaded);
        setSavedSettings(loaded);
      }

      // Fetch profile
      const profileRes = await fetch(`/api/business/${slug}/profile/me`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setIsResource(profileData.isResource ?? false);
        setSavedIsResource(profileData.isResource ?? false);
        setProfileId(profileData.id);
      }
    };

    fetchAll();
  }, [slug]);

  const handleSave = async () => {
    setLoading(true);

    // Guardar business settings
    const res = await fetch(`/api/business/${slug}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      setLoading(false);
      showNotification({ title: "Error", message: "No se pudo guardar", color: "red" });
      return;
    }

    setSavedSettings(settings);

    // Guardar perfil si cambió
    if (profileId && isResource !== savedIsResource) {
      await fetch(`/api/business/${slug}/profile/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResource }),
      });
      setSavedIsResource(isResource);
    }

    setLoading(false);
    showNotification({ title: "Guardado", message: "Configuración guardada", color: "green" });
  };

  const update = (field: keyof BusinessSettings, value: string) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Configuración</Title>
        <Button
          leftSection={<IconDeviceFloppy size={18} />}
          onClick={handleSave}
          loading={loading}
          disabled={!hasChanges}
        >
          {hasChanges ? "Guardar" : "Guardado"}
        </Button>
      </Group>

      <Divider />

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Información general</Text>
          <TextInput
            label="Nombre del negocio"
            value={settings.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <Textarea
            label="Descripción"
            value={settings.description}
            onChange={(e) => update("description", e.target.value)}
            autosize
            minRows={2}
          />
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Apariencia</Text>
          <ColorInput
            label="Color principal"
            value={settings.primaryColor}
            onChange={(value) => update("primaryColor", value)}
            format="hex"
          />
          <TextInput
            label="URL del logo"
            placeholder="https://..."
            value={settings.logoUrl}
            onChange={(e) => update("logoUrl", e.target.value)}
          />
          <TextInput
            label="URL del banner"
            placeholder="https://..."
            value={settings.bannerUrl}
            onChange={(e) => update("bannerUrl", e.target.value)}
          />
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Redes sociales</Text>
          <TextInput
            label="WhatsApp"
            placeholder="+52 55 1234 5678"
            value={settings.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
          />
          <TextInput
            label="Facebook"
            placeholder="facebook.com/tunegocio"
            value={settings.facebook}
            onChange={(e) => update("facebook", e.target.value)}
          />
          <TextInput
            label="Instagram"
            placeholder="@tunegocio"
            value={settings.instagram}
            onChange={(e) => update("instagram", e.target.value)}
          />
          <TextInput
            label="Sitio web"
            placeholder="https://tunegocio.com"
            value={settings.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Mi perfil</Text>
          <Switch
            label="Aparecer como recurso disponible"
            description="Al activar esto, podrás ser asignado como recurso en las citas"
            checked={isResource}
            onChange={(e) => setIsResource(e.currentTarget.checked)}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}