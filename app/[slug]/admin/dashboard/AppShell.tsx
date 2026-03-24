"use client";

import {
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Stack,
} from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconExternalLink,
  IconLayoutDashboard,
  IconLogout,
  IconSettings,
  IconTag,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useRealtimeAppointments } from "@/lib/hooks/useRealTimeAppointments";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { initOneSignal } from "@/lib/oneSignal";
import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";

const MessageNewAppointment = ({
  booking,
  slug,
}: {
  booking: any;
  slug: string;
}) => {
  const router = useRouter();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(booking.startTime));

  const bookingUrl = `/${slug}/admin/dashboard/bookings?date=${date}`;

  const handleClick = async () => {
    // 1️⃣ Redirect first
    router.push(bookingUrl);

    // 2️⃣ Then hide notification
    notifications.hide(booking.id);
  };

  return (
    <Stack>
      Nueva cita: {booking.clientName} - {booking.service.name}
      <span
        style={{ color: "blue", cursor: "pointer", fontWeight: 600 }}
        onClick={handleClick}
      >
        Ver cita →
      </span>
    </Stack>
  );
};

export const AppShellAdmin = ({
  children,
  business,
}: {
  children: React.ReactNode;
  business: any;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [opened, { toggle, close }] = useDisclosure();
  const { slug } = useParams();

  const base = `/${slug}/admin/dashboard`;
  const dashboardPath = base;
  const bookingsPath = `${base}/bookings`;
  const availabilityPath = `${base}/availability`;
  const settingsPath = `${base}/settings`;
  const servicesPath = `${base}/services`;
  const resourcesPath = `${base}/resources`;

  const [currentPath, setCurrentPath] = useState(pathname);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { newAppointmentAlert } = useRealtimeAppointments(
    business?.id,
    (booking) => {
      notifications.show({
        id: booking.id,
        title: "📅 Nueva cita recibida",
        message: (
          <MessageNewAppointment slug={slug as string} booking={booking} />
        ),
        color: "green",
        autoClose: 10000,
      });
      /* setTimeout(() => {
        router.refresh();
      }, 500); */
    },
  );

  useEffect(() => {
    if (opened) close();
  }, [pathname]);

  useEffect(() => {
    initOneSignal();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      // 1. Sign out global
      const browserSupabase = createBrowserSupabaseClient();
      await browserSupabase.auth.signOut({ scope: "global" });

      // 2. Limpiar storage manualmente
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();

        // Limpiar cookies de Supabase
        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0].trim();
          if (name.includes("sb-") || name.includes("supabase")) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          }
        });
      }

      // 3. Hard redirect para limpiar estado de React
      window.location.href = `/${slug}/admin/login`;
    } catch (error) {
      setLoggingOut(false);
    }
  };

  if (!mounted) {
    return <div style={{ background: "white", height: "100vh" }} />;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={opened}
            onClick={(e) => {
              e.stopPropagation(); // Evita que otros elementos capturen el toque
              toggle();
            }}
            hiddenFrom="sm"
            size="sm"
          />
          Header
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section p="md">Navbar header</AppShell.Section>
        <AppShell.Section grow my="md" component={ScrollArea} px="md">
          <Stack gap="xs">
            <NavLink
              label="Dashboard"
              leftSection={<IconLayoutDashboard size={18} />}
              active={pathname === dashboardPath}
              component={Link}
              href={dashboardPath}
            />

            <NavLink
              label="Citas"
              leftSection={<IconCalendar size={18} />}
              active={pathname === bookingsPath}
              component={Link}
              href={bookingsPath}
            />

            <NavLink
              label="Disponibilidad"
              leftSection={<IconClock size={18} />}
              active={pathname === availabilityPath}
              component={Link}
              href={availabilityPath}
            />

            <NavLink
              label="Configuración"
              leftSection={<IconSettings size={18} />}
              active={pathname === settingsPath}
              component={Link}
              href={settingsPath}
            />

            <NavLink
              label="Servicios"
              leftSection={<IconTag size={18} />}
              active={pathname === servicesPath}
              component={Link}
              href={servicesPath}
            />

            <NavLink
              label="Recursos"
              leftSection={<IconUsers size={18} />}
              active={pathname === resourcesPath}
              component={Link}
              href={resourcesPath}
            />
          </Stack>
        </AppShell.Section>
        <AppShell.Section p="md">
          <NavLink
            label="Ver página de citas"
            leftSection={<IconExternalLink size={18} />}
            component="a"
            href={`/${slug}/book`}
            target="_blank"
          />
        </AppShell.Section>
        <AppShell.Section p="md">
          <Button
            variant="subtle"
            color="red"
            fullWidth
            leftSection={<IconLogout size={18} />}
            onClick={handleLogout}
            loading={loggingOut}
          >
            Cerrar sesión
          </Button>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <div
          style={{ padding: "var(--mantine-spacing-md)", paddingBottom: 80 }}
        >
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
};
