"use client";

import {
  AppShell,
  Burger,
  Button,
  Container,
  Group,
  NavLink,
  ScrollArea,
  Stack,
} from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconLayoutDashboard,
  IconLogout,
  IconSettings
} from "@tabler/icons-react";
import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useRealtimeAppointments } from "@/lib/hooks/useRealTimeAppointments";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { initOneSignal } from "@/lib/oneSignal";
import { browserSupabase } from "@/lib/supabaseBrowser";

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
  const [opened, { toggle, close }] = useDisclosure();
  const { slug } = useParams();

  const base = `/${slug}/admin/dashboard`;
  const dashboardPath = base;
  const bookingsPath = `${base}/bookings`;
  const availabilityPath = `${base}/availability`;
  const settingsPath = `${base}/settings`;

  const [currentPath, setCurrentPath] = useState(pathname);
  const [loggingOut, setLoggingOut] = useState(false);

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
    },
  );

  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => {
    initOneSignal();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await browserSupabase.auth.signOut();
    router.push(`/${slug}/admin/login`);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
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
          </Stack>
        </AppShell.Section>
        <AppShell.Section p="md">
          Navbar footer – always at the bottom
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
        <Container size="sm" pb={80}>
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
