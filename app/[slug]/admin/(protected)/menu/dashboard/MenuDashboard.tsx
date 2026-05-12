"use client";

import { SimpleGrid, Card, Text, Group, ThemeIcon, Stack, Button, Divider } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconTag,
  IconSettings,
  IconStar,
  IconAlertTriangle,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "next/link";

type Props = {
  slug: string;
  stats: {
    totalCategories:  number;
    activeCategories: number;
    totalItems:       number;
    activeItems:      number;
    unavailableItems: number;
    totalModifiers:   number;
    activePromos:     number;
  };
};

export default function MenuDashboard({ slug, stats }: Props) {
  const base = `/${slug}/admin/menu`;

  const statCards = [
    {
      label:   "Categorías activas",
      value:   stats.activeCategories,
      sub:     `${stats.totalCategories} en total`,
      color:   "blue",
      icon:    <IconLayoutDashboard size={20} />,
      href:    `${base}/categories`,
    },
    {
      label:   "Platillos activos",
      value:   stats.activeItems,
      sub:     `${stats.totalItems} en total`,
      color:   "teal",
      icon:    <IconTag size={20} />,
      href:    `${base}/items`,
    },
    {
      label:   "Modificadores",
      value:   stats.totalModifiers,
      sub:     "grupos de opciones",
      color:   "violet",
      icon:    <IconSettings size={20} />,
      href:    `${base}/modifiers`,
    },
    {
      label:   "Especiales hoy",
      value:   stats.activePromos,
      sub:     "promociones activas",
      color:   "orange",
      icon:    <IconStar size={20} />,
      href:    `${base}/promotions`,
    },
  ];

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Text fw={700} size="xl">Dashboard — Menú Digital</Text>
          <Text size="sm" c="dimmed">Resumen de tu carta</Text>
        </div>
        <Button
          component="a"
          href={`/${slug}/menu`}
          target="_blank"
          leftSection={<IconExternalLink size={14} />}
          variant="light"
          size="sm"
        >
          Ver menú público
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
        {statCards.map((card) => (
          <Card key={card.label} component={Link} href={card.href} withBorder radius="md" style={{ textDecoration: "none" }}>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed" fw={500}>{card.label}</Text>
              <ThemeIcon color={card.color} variant="light" size="md" radius="md">
                {card.icon}
              </ThemeIcon>
            </Group>
            <Text fw={800} size="2rem" lh={1}>{card.value}</Text>
            <Text size="xs" c="dimmed" mt={4}>{card.sub}</Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Alerta de platillos agotados */}
      {stats.unavailableItems > 0 && (
        <Card withBorder radius="md" style={{ borderColor: "var(--mantine-color-orange-4)" }}>
          <Group gap="sm">
            <ThemeIcon color="orange" variant="light" size="md" radius="md">
              <IconAlertTriangle size={16} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                {stats.unavailableItems} {stats.unavailableItems === 1 ? "platillo agotado" : "platillos agotados"}
              </Text>
              <Text size="xs" c="dimmed">
                Están visibles en el menú pero marcados como no disponibles.{" "}
                <Link href={`${base}/items`} style={{ color: "var(--mantine-color-orange-6)" }}>
                  Ir a platillos →
                </Link>
              </Text>
            </div>
          </Group>
        </Card>
      )}

      <Divider />

      {/* Accesos rápidos */}
      <div>
        <Text fw={600} size="sm" c="dimmed" mb="sm" tt="uppercase" style={{ letterSpacing: ".06em" }}>
          Accesos rápidos
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {[
            { label: "Nueva categoría",   href: `${base}/categories` },
            { label: "Nuevo platillo",    href: `${base}/items` },
            { label: "Nuevo modificador", href: `${base}/modifiers` },
            { label: "Nueva promoción",   href: `${base}/promotions` },
          ].map((q) => (
            <Button key={q.label} component={Link} href={q.href} variant="default" size="sm" fullWidth>
              {q.label}
            </Button>
          ))}
        </SimpleGrid>
      </div>
    </Stack>
  );
}
