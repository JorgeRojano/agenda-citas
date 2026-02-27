"use client";

import {
  Anchor,
  AppShell,
  Burger,
  Container,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { usePathname, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { IconCalendar, IconClock, IconLayoutDashboard } from "@tabler/icons-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [opened, { toggle }] = useDisclosure();
  const { slug } = useParams();

  const base = `/${slug}/admin/dashboard`;
  const dashboardPath = base;
  const bookingsPath = `${base}/bookings`;
  const availabilityPath = `${base}/availability`;

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
          </Stack>
        </AppShell.Section>
        <AppShell.Section p="md">
          Navbar footer – always at the bottom
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="sm" pb={80}>
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
