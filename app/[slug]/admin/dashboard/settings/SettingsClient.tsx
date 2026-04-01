"use client";

import {
  Stack, Title, Divider, TextInput, Textarea,
  Button, Group, Text, Paper, Switch, ColorSwatch,
  SimpleGrid, Tooltip, Alert, Loader,
} from "@mantine/core";
import { IconDeviceFloppy, IconCheck, IconUsers, IconUser, IconUpload, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { showNotification } from "@mantine/notifications";
import { LocationSection } from "./LocationSection";
import { GallerySection } from "./GallerySection";

type BusinessSettings = {
  name: string;
  description: string;
  primaryColor: string;
  logoUrl: string;
  bannerUrl: string;
  hasStaff: boolean;
  address: string;
  mapsUrl: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  website: string;
};

const defaultSettings: BusinessSettings = {
  name: "", description: "", primaryColor: "blue",
  logoUrl: "", bannerUrl: "", hasStaff: false,
  address: "", mapsUrl: "",
  whatsapp: "", instagram: "", facebook: "", website: "",
};

const MANTINE_COLORS = [
  { name: "red",    label: "Rojo"     },
  { name: "pink",   label: "Rosa"     },
  { name: "grape",  label: "Uva"      },
  { name: "violet", label: "Violeta"  },
  { name: "indigo", label: "Índigo"   },
  { name: "blue",   label: "Azul"     },
  { name: "cyan",   label: "Cian"     },
  { name: "teal",   label: "Teal"     },
  { name: "green",  label: "Verde"    },
  { name: "lime",   label: "Lima"     },
  { name: "yellow", label: "Amarillo" },
  { name: "orange", label: "Naranja"  },
  { name: "gray",   label: "Gris"     },
  { name: "dark",   label: "Oscuro"   },
] as const;

interface Props {
  initialImages: { id: string; url: string; order: number }[];
}

export default function SettingsClient({ initialImages }: Props) {
  const { slug } = useParams();
  const router   = useRouter();

  const [settings, setSettings]         = useState<BusinessSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<BusinessSettings>(defaultSettings);
  const [loading, setLoading]           = useState(false);

  const [isResource, setIsResource]         = useState(false);
  const [savedIsResource, setSavedIsResource] = useState(false);
  const [profileId, setProfileId]           = useState<string | null>(null);
  const [profileName, setProfileName]       = useState("");
  const [savedProfileName, setSavedProfileName] = useState("");
  const [profileEmail, setProfileEmail]     = useState("");
  const [savedProfileEmail, setSavedProfileEmail] = useState("");
  const [specialty, setSpecialty]           = useState("");
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
        const loaded: BusinessSettings = {
          name:         data.name         ?? "",
          description:  data.description  ?? "",
          primaryColor: data.primaryColor  ?? "blue",
          logoUrl:      data.logoUrl       ?? "",
          bannerUrl:    data.bannerUrl     ?? "",
          hasStaff:     data.hasStaff      ?? false,
          address:      data.address       ?? "",
          mapsUrl:      data.mapsUrl       ?? "",
          whatsapp:     data.whatsapp      ?? "",
          instagram:    data.instagram     ?? "",
          facebook:     data.facebook      ?? "",
          website:      data.website       ?? "",
        };
        setSettings(loaded);
        setSavedSettings(loaded);
      }

      const profileRes = await fetch(`/api/business/${slug}/profile/me`);
      if (profileRes.ok) {
        const d = await profileRes.json();
        setIsResource(d.isResource ?? false);
        setSavedIsResource(d.isResource ?? false);
        setProfileId(d.id);
        setProfileName(d.name ?? "");
        setSavedProfileName(d.name ?? "");
        setProfileEmail(d.email ?? "");
        setSavedProfileEmail(d.email ?? "");
        setSpecialty(d.specialty ?? "");
        setSavedSpecialty(d.specialty ?? "");
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
    router.refresh();
  };

  const update = (field: keyof BusinessSettings, value: string | boolean) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  const logoInputRef   = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo,   setUploadingLogo]   = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleImageUpload = async (
    file: File,
    field: "logoUrl" | "bannerUrl",
    setUploading: (v: boolean) => void,
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      showNotification({ title: "Archivo muy grande", message: "Máximo 5 MB", color: "red" });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/business/${slug}/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      update(field, url);
    } catch {
      showNotification({ title: "Error", message: "No se pudo subir la imagen", color: "red" });
    } finally {
      setUploading(false);
    }
  };

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

      {/* Información general */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Información general</Text>
          <TextInput label="Nombre del negocio" value={settings.name} onChange={(e) => update("name", e.target.value)} />
          <Textarea label="Descripción" value={settings.description} onChange={(e) => update("description", e.target.value)} autosize minRows={2} />
        </Stack>
      </Paper>

      {/* Apariencia */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Apariencia</Text>
          <div>
            <Text size="sm" fw={500} mb={8}>Color principal</Text>
            <SimpleGrid cols={7} spacing={8}>
              {MANTINE_COLORS.map(({ name, label }) => (
                <Tooltip key={name} label={label} withArrow position="top">
                  <ColorSwatch
                    color={`var(--mantine-color-${name}-6)`}
                    size={32} radius="sm" style={{ cursor: "pointer" }}
                    onClick={() => update("primaryColor", name)}
                  >
                    {settings.primaryColor === name && <IconCheck size={16} color="white" stroke={3} />}
                  </ColorSwatch>
                </Tooltip>
              ))}
            </SimpleGrid>
          </div>
          {/* Logo */}
          <div>
            <Text size="sm" fw={500} mb={6}>Logo</Text>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {settings.logoUrl ? (
                <div style={{ position: "relative", width: 56, height: 56, borderRadius: 12, overflow: "hidden", border: "1px solid var(--mantine-color-default-border)", flexShrink: 0 }}>
                  <img src={settings.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => update("logoUrl", "")} style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    <IconX size={9} color="white" />
                  </button>
                </div>
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--mantine-color-default-hover)", border: "1px dashed var(--mantine-color-default-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {uploadingLogo ? <Loader size="xs" /> : <IconUpload size={18} color="var(--mantine-color-dimmed)" />}
                </div>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "logoUrl", setUploadingLogo); e.target.value = ""; }} />
              <Button size="xs" variant="default" onClick={() => logoInputRef.current?.click()} loading={uploadingLogo}>
                {settings.logoUrl ? "Cambiar" : "Subir logo"}
              </Button>
            </div>
          </div>

          {/* Banner */}
          <div>
            <Text size="sm" fw={500} mb={6}>Banner</Text>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {settings.bannerUrl ? (
                <div style={{ position: "relative", flex: 1, height: 80, borderRadius: 10, overflow: "hidden", border: "1px solid var(--mantine-color-default-border)" }}>
                  <img src={settings.bannerUrl} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => update("bannerUrl", "")} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    <IconX size={10} color="white" />
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, height: 80, borderRadius: 10, background: "var(--mantine-color-default-hover)", border: "1px dashed var(--mantine-color-default-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {uploadingBanner ? <Loader size="xs" /> : <IconUpload size={18} color="var(--mantine-color-dimmed)" />}
                </div>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "bannerUrl", setUploadingBanner); e.target.value = ""; }} />
              <Button size="xs" variant="default" onClick={() => bannerInputRef.current?.click()} loading={uploadingBanner}>
                {settings.bannerUrl ? "Cambiar" : "Subir banner"}
              </Button>
            </div>
          </div>
        </Stack>
      </Paper>

      {/* Ubicación */}
      <LocationSection
        address={settings.address}
        mapsUrl={settings.mapsUrl}
        onChange={(field, value) => update(field, value)}
      />

      {/* Galería — maneja su propio estado y API calls */}
      <GallerySection slug={slug as string} initialImages={initialImages} />

      {/* Staff */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Equipo de trabajo</Text>
          <Text size="sm" fw={500}>¿Cómo gestionas tu negocio?</Text>
          <SimpleGrid cols={2} spacing="sm">
            <div
              onClick={() => update("hasStaff", false)}
              style={{
                border: `2px solid ${!settings.hasStaff ? `var(--mantine-color-${settings.primaryColor}-4)` : "var(--mantine-color-default-border)"}`,
                background: !settings.hasStaff ? `var(--mantine-color-${settings.primaryColor}-light)` : "var(--mantine-color-default)",
                borderRadius: 10, padding: "14px 12px", cursor: "pointer",
                position: "relative", transition: "all 0.15s ease",
              }}
            >
              {!settings.hasStaff && (
                <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: `var(--mantine-color-${settings.primaryColor}-6)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconCheck size={10} color="white" stroke={3} />
                </div>
              )}
              <IconUser size={22} style={{ color: `var(--mantine-color-${settings.primaryColor}-6)`, marginBottom: 8 }} />
              <Text size="sm" fw={600}>Solo yo</Text>
              <Text size="xs" c="dimmed" mt={2}>Negocio unipersonal, tú eres el único recurso</Text>
            </div>
            <div
              onClick={() => update("hasStaff", true)}
              style={{
                border: `2px solid ${settings.hasStaff ? `var(--mantine-color-${settings.primaryColor}-4)` : "var(--mantine-color-default-border)"}`,
                background: settings.hasStaff ? `var(--mantine-color-${settings.primaryColor}-light)` : "var(--mantine-color-default)",
                borderRadius: 10, padding: "14px 12px", cursor: "pointer",
                position: "relative", transition: "all 0.15s ease",
              }}
            >
              {settings.hasStaff && (
                <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: `var(--mantine-color-${settings.primaryColor}-6)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconCheck size={10} color="white" stroke={3} />
                </div>
              )}
              <IconUsers size={22} style={{ color: `var(--mantine-color-${settings.primaryColor}-6)`, marginBottom: 8 }} />
              <Text size="sm" fw={600}>Tengo colaboradores</Text>
              <Text size="xs" c="dimmed" mt={2}>Hay más personas que atienden citas</Text>
            </div>
          </SimpleGrid>
          {settings.hasStaff ? (
            <Alert variant="light" color="blue" icon={<IconUsers size={16} />}>
              El menú Recursos estará visible y los clientes podrán elegir colaborador al reservar.
            </Alert>
          ) : (
            <Alert variant="light" color="gray" icon={<IconUser size={16} />}>
              Tú eres el único recurso. El paso de selección de colaborador no aparecerá en la reserva.
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Redes sociales */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Redes sociales</Text>
          <TextInput label="WhatsApp" placeholder="+52 55 1234 5678" value={settings.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
          <TextInput label="Facebook" placeholder="facebook.com/tunegocio" value={settings.facebook} onChange={(e) => update("facebook", e.target.value)} />
          <TextInput label="Instagram" placeholder="@tunegocio" value={settings.instagram} onChange={(e) => update("instagram", e.target.value)} />
          <TextInput label="Sitio web" placeholder="https://tunegocio.com" value={settings.website} onChange={(e) => update("website", e.target.value)} />
        </Stack>
      </Paper>

      {/* Mi perfil */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Mi perfil</Text>
          <TextInput label="Nombre" placeholder="Tu nombre completo" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          <TextInput label="Email" placeholder="tu@email.com" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
          {settings.hasStaff && (
            <>
              <Switch
                label="Aparecer como recurso disponible"
                description="Al activar esto, podrás ser asignado como recurso en las citas"
                checked={isResource}
                onChange={(e) => setIsResource(e.currentTarget.checked)}
              />
              {isResource && (
                <TextInput label="Especialidad" placeholder="Ej: Terapeuta de lenguaje" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}