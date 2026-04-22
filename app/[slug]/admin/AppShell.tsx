"use client";

import {
  AppShell, Burger, Button, Divider, Group, Modal,
  NavLink, PasswordInput, ScrollArea, Stack, Text,
} from "@mantine/core";
import {
  IconCalendar, IconClock, IconExternalLink,
  IconLayoutDashboard, IconLock, IconLogout, IconQrcode, IconSettings,
  IconTag, IconUsers, IconToolsKitchen2,
} from "@tabler/icons-react";
import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useRealtimeAppointments } from "@/lib/hooks/useRealTimeAppointments";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { initOneSignal } from "@/lib/oneSignal";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

const MessageNewAppointment = ({ booking, slug }: { booking: any; slug: string }) => {
  const router = useRouter();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(booking.startTime));

  return (
    <Stack>
      Nueva cita: {booking.clientName} - {booking.service.name}
      <span
        style={{ color: "blue", cursor: "pointer", fontWeight: 600 }}
        onClick={() => { router.push(`/${slug}/admin/appointments/bookings?date=${date}`); notifications.hide(booking.id); }}
      >
        Ver cita →
      </span>
    </Stack>
  );
};

export const AppShellAdmin = ({
  children,
  business,
  userRole,
  activeModules = [],
}: {
  children: React.ReactNode;
  business: any;
  userRole?: string;
  // La gestión de módulos la hace el SUPER_ADMIN en Supabase → tabla BusinessModule
  activeModules?: string[];
}) => {
  const pathname  = usePathname();
  const router    = useRouter();
  const [mounted, setMounted]   = useState(false);
  const [opened, { toggle, close }] = useDisclosure();
  const [loggingOut, setLoggingOut] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdOpened, { open: openPwd, close: closePwd }] = useDisclosure(false);
  const { slug } = useParams();

  const pwdForm = useForm({
    initialValues: { password: "", confirm: "" },
    validate: {
      password: (v) => (v.length < 6 ? "Mínimo 6 caracteres" : null),
      confirm:  (v, values) => (v !== values.password ? "Las contraseñas no coinciden" : null),
    },
  });

  const handleChangePwd = async (values: typeof pwdForm.values) => {
    setChangingPwd(true);
    try {
      const browserSupabase = createBrowserSupabaseClient();
      const { error } = await browserSupabase.auth.updateUser({ password: values.password });
      if (error) throw new Error(error.message);
      notifications.show({ title: "Contraseña actualizada", message: "Tu contraseña fue cambiada exitosamente", color: "green" });
      pwdForm.reset();
      closePwd();
    } catch (e: any) {
      notifications.show({ title: "Error", message: e.message, color: "red" });
    } finally {
      setChangingPwd(false);
    }
  };

  const base             = `/${slug}/admin`;
  const dashboardPath    = `${base}/appointments/dashboard`;
  const bookingsPath     = `${base}/appointments/bookings`;
  const availabilityPath = `${base}/appointments/availability`;
  const settingsPath     = `${base}/settings`;
  const servicesPath     = `${base}/appointments/services`;
  const resourcesPath    = `${base}/appointments/resources`;
  const qrPath           = `${base}/qr`;
  const menuDashboardPath = `${base}/menu/dashboard`;

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (opened) close(); }, [pathname]);
  useEffect(() => { initOneSignal(); }, []);

  useRealtimeAppointments(
    business?.id,
    (booking) => {
      notifications.show({
        id: booking.id,
        title: "📅 Nueva cita recibida",
        message: <MessageNewAppointment slug={slug as string} booking={booking} />,
        color: "green",
        autoClose: 10000,
      });
      setTimeout(() => router.refresh(), 500);
    },
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const browserSupabase = createBrowserSupabaseClient();
      await browserSupabase.auth.signOut({ scope: "global" });
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0].trim();
          if (name.includes("sb-") || name.includes("supabase"))
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
      }
      window.location.href = `/${slug}/admin/login`;
    } catch {
      setLoggingOut(false);
    }
  };

  if (!mounted) return (
    <div style={{ background: "var(--mantine-color-body)", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      {business?.logoUrl ? (
        <img src={business.logoUrl} alt="logo" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
      ) : (
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `var(--mantine-color-${business?.primaryColor ?? "blue"}-6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "white" }}>
          {business?.name?.slice(0, 2).toUpperCase() ?? "…"}
        </div>
      )}
      <Text size="sm" c="dimmed">Cargando...</Text>
    </div>
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={(e) => { e.stopPropagation(); toggle(); }} hiddenFrom="sm" size="sm" />
          {business?.logoUrl ? (
            <img src={business.logoUrl} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `var(--mantine-color-${business?.primaryColor ?? "blue"}-6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>
              {business?.name?.slice(0, 2).toUpperCase() ?? "…"}
            </div>
          )}
          <Text fw={600} size="sm">{business?.name}</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section p="md"><Text fw={600} size="sm">Menú</Text></AppShell.Section>
        <AppShell.Section grow my="md" component={ScrollArea} px="md">
          <Stack gap={4}>

            {/* Grupo Citas — visible solo si el módulo appointments está activo */}
            {activeModules.includes("appointments") && (
              <NavLink
                label="Citas"
                leftSection={<IconCalendar size={18} />}
                defaultOpened={pathname.startsWith(`${base}/appointments`)}
                active={pathname.startsWith(`${base}/appointments`)}
              >
                <NavLink label="Dashboard"      leftSection={<IconLayoutDashboard size={16} />} active={pathname === dashboardPath}    component={Link} href={dashboardPath} />
                <NavLink label="Calendario"     leftSection={<IconCalendar size={16} />}        active={pathname === bookingsPath}      component={Link} href={bookingsPath} />
                <NavLink label="Disponibilidad" leftSection={<IconClock size={16} />}           active={pathname === availabilityPath}  component={Link} href={availabilityPath} />
                {userRole !== "STAFF" && (
                  <>
                    <NavLink label="Servicios" leftSection={<IconTag size={16} />}    active={pathname === servicesPath}  component={Link} href={servicesPath} />
                    {business?.hasStaff && (
                      <NavLink label="Recursos" leftSection={<IconUsers size={16} />} active={pathname === resourcesPath} component={Link} href={resourcesPath} />
                    )}
                  </>
                )}
              </NavLink>
            )}

            {/* Grupo Menú Digital — visible solo si el módulo digital-menu está activo */}
            {activeModules.includes("digital-menu") && userRole !== "STAFF" && (
              <NavLink
                label="Menú Digital"
                leftSection={<IconToolsKitchen2 size={18} />}
                defaultOpened={pathname.startsWith(`${base}/menu`)}
                active={pathname.startsWith(`${base}/menu`)}
              >
                <NavLink label="Dashboard"     leftSection={<IconLayoutDashboard size={16} />} active={pathname === menuDashboardPath}                   component={Link} href={menuDashboardPath} />
                <NavLink label="Platillos"     leftSection={<IconTag size={16} />}             active={pathname.startsWith(`${base}/menu/items`)}       component={Link} href={`${base}/menu/items`} />
                <NavLink label="Categorías"    leftSection={<IconLayoutDashboard size={16} />} active={pathname.startsWith(`${base}/menu/categories`)}  component={Link} href={`${base}/menu/categories`} />
                <NavLink label="Modificadores" leftSection={<IconSettings size={16} />}        active={pathname.startsWith(`${base}/menu/modifiers`)}   component={Link} href={`${base}/menu/modifiers`} />
                <NavLink label="Promociones"   leftSection={<IconQrcode size={16} />}          active={pathname.startsWith(`${base}/menu/promotions`)}  component={Link} href={`${base}/menu/promotions`} />
              </NavLink>
            )}

            {/* Sección compartida — siempre visible para ADMIN */}
            {userRole !== "STAFF" && (
              <>
                <NavLink label="Código QR"     leftSection={<IconQrcode size={18} />}  active={pathname === qrPath}       component={Link} href={qrPath} />
                <NavLink label="Configuración" leftSection={<IconSettings size={18} />} active={pathname === settingsPath} component={Link} href={settingsPath} />
              </>
            )}
          </Stack>
        </AppShell.Section>

        <AppShell.Section p="md">
          {activeModules.includes("appointments") && (
            <NavLink label="Ver página de citas" leftSection={<IconExternalLink size={18} />} component="a" href={`/${slug}/book`} target="_blank" />
          )}
          {activeModules.includes("digital-menu") && (
            <NavLink label="Ver menú" leftSection={<IconExternalLink size={18} />} component="a" href={`/${slug}/menu`} target="_blank" />
          )}
        </AppShell.Section>
        <AppShell.Section>
          <Divider />
          <Stack gap={0} p="xs">
            <NavLink
              label="Cambiar contraseña"
              leftSection={<IconLock size={16} />}
              color="gray"
              onClick={() => { pwdForm.reset(); openPwd(); }}
            />
            <NavLink
              label={loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              leftSection={<IconLogout size={16} />}
              color="red"
              onClick={handleLogout}
            />
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <Modal opened={pwdOpened} onClose={closePwd} title="Cambiar contraseña" centered size="sm">
        <form onSubmit={pwdForm.onSubmit(handleChangePwd)}>
          <Stack gap="md">
            <PasswordInput label="Nueva contraseña" placeholder="Mínimo 6 caracteres" required {...pwdForm.getInputProps("password")} />
            <PasswordInput label="Confirmar contraseña" placeholder="Repite la contraseña" required {...pwdForm.getInputProps("confirm")} />
            <Button type="submit" loading={changingPwd} fullWidth>Guardar contraseña</Button>
          </Stack>
        </form>
      </Modal>

      <AppShell.Main>
        <div style={{ padding: "var(--mantine-spacing-md)", paddingBottom: 80 }}>
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
};