"use client";

import {
  Stack,
  Title,
  Divider,
  TextInput,
  Textarea,
  Button,
  Group,
  Text,
  Paper,
  Switch,
  ColorSwatch,
  SimpleGrid,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { showNotification } from "@mantine/notifications";
import { IconDeviceFloppy, IconCheck } from "@tabler/icons-react";

type BusinessSettings = {
  name: string;
  description: string;
  primaryColor: string; // ahora guarda nombre Mantine: "blue", "violet", etc.
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
  primaryColor: "blue", // era "#2563eb"
  logoUrl: "",
  bannerUrl: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  website: "",
};

// Colores sugeridos de la paleta Mantine (tono 6 = color principal)
const MANTINE_COLORS = [
  { name: "red",    label: "Rojo"    },
  { name: "pink",   label: "Rosa"    },
  { name: "grape",  label: "Uva"     },
  { name: "violet", label: "Violeta" },
  { name: "indigo", label: "Índigo"  },
  { name: "blue",   label: "Azul"    },
  { name: "cyan",   label: "Cian"    },
  { name: "teal",   label: "Teal"    },
  { name: "green",  label: "Verde"   },
  { name: "lime",   label: "Lima"    },
  { name: "yellow", label: "Amarillo"},
  { name: "orange", label: "Naranja" },
  { name: "gray",   label: "Gris"    },
  { name: "dark",   label: "Oscuro"  },
] as const;

export default function SettingsPage() {
  const { slug } = useParams();
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<BusinessSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  const [isResource, setIsResource] = useState(false);
  const [savedIsResource, setSavedIsResource] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [savedProfileName, setSavedProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [savedProfileEmail, setSavedProfileEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [savedSpecialty, setSavedSpecialty] = useState("");

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettings) ||
    isResource !== savedIsResource ||
    profileName !== savedProfileName ||
    profileEmail !== savedProfileEmail ||
    specialty !== savedSpecialty;

  useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch(`/api/business/${slug}/settings`);
      if (res.ok) {
        const data = await res.json();
        const loaded = {
          name: data.name ?? "",
          description: data.description ?? "",
          primaryColor: data.primaryColor ?? "blue",
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

      const profileRes = await fetch(`/api/business/${slug}/profile/me`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setIsResource(profileData.isResource ?? false);
        setSavedIsResource(profileData.isResource ?? false);
        setProfileId(profileData.id);
        setProfileName(profileData.name ?? "");
        setSavedProfileName(profileData.name ?? "");
        setProfileEmail(profileData.email ?? "");
        setSavedProfileEmail(profileData.email ?? "");
        setSpecialty(profileData.specialty ?? "");
        setSavedSpecialty(profileData.specialty ?? "");
      }
    };

    fetchAll();
  }, [slug]);

  const handleSave = async () => {
    setLoading(true);

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

    if (
      profileId &&
      (isResource !== savedIsResource ||
        profileName !== savedProfileName ||
        profileEmail !== savedProfileEmail ||
        specialty !== savedSpecialty)
    ) {
      await fetch(`/api/business/${slug}/profile/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResource, name: profileName, email: profileEmail, specialty }),
      });
      setSavedIsResource(isResource);
      setSavedProfileName(profileName);
      setSavedProfileEmail(profileEmail);
      setSavedSpecialty(specialty);
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

          {/* Color picker — reemplaza ColorInput */}
          <div>
            <Text size="sm" fw={500} mb={8}>Color principal</Text>
            <SimpleGrid cols={7} spacing={8}>
              {MANTINE_COLORS.map(({ name, label }) => (
                <Tooltip key={name} label={label} withArrow position="top">
                  <ColorSwatch
                    color={`var(--mantine-color-${name}-6)`}
                    size={32}
                    radius="sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => update("primaryColor", name)}
                  >
                    {settings.primaryColor === name && (
                      <IconCheck size={16} color="white" stroke={3} />
                    )}
                  </ColorSwatch>
                </Tooltip>
              ))}
            </SimpleGrid>
          </div>

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
          <TextInput
            label="Nombre"
            placeholder="Tu nombre completo"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
          <TextInput
            label="Email"
            placeholder="tu@email.com"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
          />
          <Switch
            label="Aparecer como recurso disponible"
            description="Al activar esto, podrás ser asignado como recurso en las citas"
            checked={isResource}
            onChange={(e) => setIsResource(e.currentTarget.checked)}
          />
          {isResource && (
            <TextInput
              label="Especialidad"
              placeholder="Ej: Terapeuta de lenguaje"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}