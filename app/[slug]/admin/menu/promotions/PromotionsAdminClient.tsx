"use client";

import {
  Stack, Group, Text, Button, Badge, ActionIcon, Modal,
  TextInput, NumberInput, Switch, Select, Textarea,
  Checkbox, SimpleGrid, Card, Divider, Table, ScrollArea,
  Paper, Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { useState, useMemo } from "react";

type PromoItem = {
  itemId:   string;
  quantity: number;
  name:     string;
  emoji:    string | null;
  price:    string;
};

type Promotion = {
  id:              string;
  name:            string;
  type:            string;
  description:     string | null;
  discountAmount:  string | null;
  discountPercent: string | null;
  validDays:       string[];
  startTime:       string | null;
  endTime:         string | null;
  isActive:        boolean;
  items:           PromoItem[];
};

type MenuItem = {
  id:    string;
  name:  string;
  emoji: string | null;
  price: string;
};

type Props = {
  slug:      string;
  promotions: Promotion[];
  menuItems:  MenuItem[];
};

const TYPE_OPTIONS = [
  { value: "combo",    label: "🍱 Combo" },
  { value: "discount", label: "💰 Descuento" },
  { value: "special",  label: "⭐ Especial" },
];

const TYPE_LABELS: Record<string, string> = {
  combo: "Combo", discount: "Descuento", special: "Especial",
};

const DAY_OPTIONS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mié" },
  { value: "thu", label: "Jue" },
  { value: "fri", label: "Vie" },
  { value: "sat", label: "Sáb" },
  { value: "sun", label: "Dom" },
];

type FormItem = { itemId: string; quantity: number };

type FormValues = {
  name:            string;
  type:            string;
  description:     string;
  discountPercent: number | null;
  validDays:       string[];
  startTime:       string;
  endTime:         string;
  isActive:        boolean;
  items:           FormItem[];
};

const emptyForm: FormValues = {
  name:            "",
  type:            "combo",
  description:     "",
  discountPercent: null,
  validDays:       ["mon","tue","wed","thu","fri","sat","sun"],
  startTime:       "",
  endTime:         "",
  isActive:        true,
  items:           [],
};

export default function PromotionsAdminClient({ slug, promotions: initial, menuItems }: Props) {
  const [promotions, setPromotions]     = useState<Promotion[]>(initial);
  const [editing, setEditing]           = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [loading, setLoading]           = useState(false);
  const [itemSearch, setItemSearch]     = useState("");

  const [formOpened,   { open: openForm,   close: closeForm }]   = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const base = `/api/business/${slug}/admin/menu/promotions`;

  const form = useForm<FormValues>({
    initialValues: emptyForm,
    validate: {
      name:      (v) => (!v.trim() ? "Nombre requerido" : null),
      type:      (v) => (!v ? "Tipo requerido" : null),
      validDays: (v) => (v.length === 0 ? "Selecciona al menos un día" : null),
    },
  });

  // Precio original (suma de platillos seleccionados)
  const originalPrice = useMemo(() => {
    return form.values.items.reduce((sum, fi) => {
      const item = menuItems.find((m) => m.id === fi.itemId);
      return sum + (item ? Number(item.price) * fi.quantity : 0);
    }, 0);
  }, [form.values.items, menuItems]);

  const discountedPrice = useMemo(() => {
    if (!form.values.discountPercent || originalPrice === 0) return originalPrice;
    return originalPrice * (1 - form.values.discountPercent / 100);
  }, [originalPrice, form.values.discountPercent]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return menuItems.filter((m) => m.name.toLowerCase().includes(q));
  }, [menuItems, itemSearch]);

  function getItemQty(itemId: string): number {
    return form.values.items.find((fi) => fi.itemId === itemId)?.quantity ?? 0;
  }

  function toggleItem(itemId: string) {
    const current = form.values.items;
    if (current.find((fi) => fi.itemId === itemId)) {
      form.setFieldValue("items", current.filter((fi) => fi.itemId !== itemId));
    } else {
      form.setFieldValue("items", [...current, { itemId, quantity: 1 }]);
    }
  }

  function setItemQty(itemId: string, quantity: number) {
    form.setFieldValue("items",
      form.values.items.map((fi) =>
        fi.itemId === itemId ? { ...fi, quantity: Math.max(1, quantity) } : fi
      )
    );
  }

  function openCreate() {
    setEditing(null);
    form.setValues(emptyForm);
    setItemSearch("");
    openForm();
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    form.setValues({
      name:            p.name,
      type:            p.type,
      description:     p.description ?? "",
      discountPercent: p.discountPercent ? Number(p.discountPercent) : null,
      validDays:       p.validDays,
      startTime:       p.startTime ?? "",
      endTime:         p.endTime ?? "",
      isActive:        p.isActive,
      items:           p.items.map((pi) => ({ itemId: pi.itemId, quantity: pi.quantity })),
    });
    setItemSearch("");
    openForm();
  }

  async function handleSubmit(values: FormValues) {
    setLoading(true);
    const payload = {
      name:            values.name,
      type:            values.type,
      description:     values.description || undefined,
      discountPercent: values.discountPercent ?? undefined,
      validDays:       values.validDays,
      startTime:       values.startTime || undefined,
      endTime:         values.endTime   || undefined,
      isActive:        values.isActive,
      items:           values.items,
    };
    try {
      if (editing) {
        const res = await fetch(`${base}/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const updatedItems: PromoItem[] = values.items.map((fi) => {
          const m = menuItems.find((mi) => mi.id === fi.itemId)!;
          return { itemId: fi.itemId, quantity: fi.quantity, name: m.name, emoji: m.emoji, price: m.price };
        });
        setPromotions((prev) => prev.map((p) => p.id === editing.id
          ? { ...p, ...values,
              discountPercent: values.discountPercent?.toString() ?? null,
              discountAmount:  null,
              description:     values.description || null,
              startTime:       values.startTime   || null,
              endTime:         values.endTime     || null,
              items:           updatedItems,
            }
          : p
        ));
        showNotification({ message: "Promoción actualizada", color: "teal" });
      } else {
        const res = await fetch(base, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setPromotions((prev) => [created, ...prev]);
        showNotification({ message: "Promoción creada", color: "teal" });
      }
      closeForm();
    } catch {
      showNotification({ message: "Error al guardar", color: "red" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`${base}/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPromotions((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showNotification({ message: "Promoción eliminada", color: "teal" });
      closeDelete();
    } catch {
      showNotification({ message: "Error al eliminar", color: "red" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <div>
          <Text fw={700} size="xl">Promociones</Text>
          <Text size="sm" c="dimmed">{promotions.length} promociones</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Nueva promoción
        </Button>
      </Group>

      {promotions.length === 0 ? (
        <Card withBorder radius="md" p="xl" style={{ textAlign: "center" }}>
          <Text c="dimmed" mb="md">Aún no tienes promociones</Text>
          <Button onClick={openCreate} leftSection={<IconPlus size={16} />}>Crear primera promoción</Button>
        </Card>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Platillos</Table.Th>
                <Table.Th>Precio</Table.Th>
                <Table.Th>Días</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {promotions.map((p) => {
                const origTotal = p.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
                const finalPrice = p.discountPercent
                  ? origTotal * (1 - Number(p.discountPercent) / 100)
                  : origTotal;
                return (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Text size="sm" fw={600}>{p.name}</Text>
                      {p.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>{p.description}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {p.items.length > 0 ? (
                        <Text size="xs" c="dimmed">
                          {p.items.map((i) => `${i.emoji ?? ""} ${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}
                        </Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {origTotal > 0 ? (
                        <Stack gap={0}>
                          {p.discountPercent && (
                            <Text size="xs" c="dimmed" td="line-through">${origTotal.toFixed(2)}</Text>
                          )}
                          <Text size="sm" fw={700} c={p.discountPercent ? "teal" : undefined}>
                            ${finalPrice.toFixed(2)}
                            {p.discountPercent && <> <Text span size="xs" c="teal">(-{p.discountPercent}%)</Text></>}
                          </Text>
                        </Stack>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={3}>
                        {DAY_OPTIONS.map((d) => (
                          <Badge
                            key={d.value}
                            size="xs"
                            variant={p.validDays.includes(d.value) ? "filled" : "outline"}
                            color={p.validDays.includes(d.value) ? "blue" : "gray"}
                          >
                            {d.label}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" color={p.isActive ? "teal" : "gray"} variant="light">
                        {p.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <ActionIcon variant="subtle" onClick={() => openEdit(p)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => { setDeleteTarget(p); openDelete(); }}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      {/* Modal crear/editar */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={editing ? "Editar promoción" : "Nueva promoción"}
        size="lg"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label="Nombre" placeholder="Combo del mediodía..." required {...form.getInputProps("name")} />
            <Select label="Tipo" data={TYPE_OPTIONS} required {...form.getInputProps("type")} />
            <Textarea label="Descripción" placeholder="Detalle de la promoción..." autosize minRows={2} {...form.getInputProps("description")} />

            <Divider label="Platillos incluidos" labelPosition="left" />

            {/* Buscador de platillos */}
            <TextInput
              placeholder="Buscar platillo..."
              leftSection={<IconSearch size={14} />}
              value={itemSearch}
              onChange={(e) => setItemSearch(e.currentTarget.value)}
            />

            <Paper withBorder radius="sm" style={{ maxHeight: 220, overflowY: "auto" }}>
              {filteredItems.length === 0 ? (
                <Text size="sm" c="dimmed" p="sm">Sin resultados</Text>
              ) : (
                filteredItems.map((item) => {
                  const qty      = getItemQty(item.id);
                  const selected = qty > 0;
                  return (
                    <Box
                      key={item.id}
                      p="xs"
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        borderBottom: "1px solid var(--mantine-color-default-border)",
                        background: selected ? "var(--mantine-color-blue-0)" : undefined,
                      }}
                    >
                      <Checkbox
                        checked={selected}
                        onChange={() => toggleItem(item.id)}
                        style={{ flexShrink: 0 }}
                      />
                      <Text size="sm" style={{ flex: 1 }}>
                        {item.emoji} {item.name}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                        ${Number(item.price).toFixed(2)}
                      </Text>
                      {selected && (
                        <NumberInput
                          size="xs"
                          min={1}
                          max={99}
                          value={qty}
                          onChange={(v) => setItemQty(item.id, Number(v))}
                          style={{ width: 70 }}
                          hideControls={false}
                        />
                      )}
                    </Box>
                  );
                })
              )}
            </Paper>

            {/* Resumen de precios */}
            {form.values.items.length > 0 && (
              <Paper withBorder radius="sm" p="sm" bg="gray.0">
                <Group justify="space-between" mb={4}>
                  <Text size="sm" c="dimmed">Precio original</Text>
                  <Text size="sm" fw={600}>${originalPrice.toFixed(2)}</Text>
                </Group>
                <Group align="flex-end" gap="sm">
                  <NumberInput
                    label="Descuento (%)"
                    placeholder="15"
                    suffix="%"
                    min={0}
                    max={99}
                    decimalScale={1}
                    style={{ flex: 1 }}
                    {...form.getInputProps("discountPercent")}
                  />
                  <Stack gap={2} style={{ flexShrink: 0, paddingBottom: 4 }}>
                    <Text size="xs" c="dimmed">Precio final</Text>
                    <Text size="lg" fw={800} c="teal">${discountedPrice.toFixed(2)}</Text>
                  </Stack>
                </Group>
              </Paper>
            )}

            <Divider label="Días válidos" labelPosition="left" />
            <SimpleGrid cols={7} spacing="xs">
              {DAY_OPTIONS.map((d) => (
                <Checkbox
                  key={d.value}
                  label={d.label}
                  checked={form.values.validDays.includes(d.value)}
                  onChange={(e) => {
                    const checked = e.currentTarget.checked;
                    form.setFieldValue("validDays",
                      checked
                        ? [...form.values.validDays, d.value]
                        : form.values.validDays.filter((v) => v !== d.value)
                    );
                  }}
                  styles={{ label: { fontSize: 12 } }}
                />
              ))}
            </SimpleGrid>
            {form.errors.validDays && (
              <Text size="xs" c="red">{form.errors.validDays}</Text>
            )}

            <Divider label="Horario (opcional)" labelPosition="left" />
            <Group grow>
              <TextInput label="Hora inicio" placeholder="12:00" {...form.getInputProps("startTime")} />
              <TextInput label="Hora fin"    placeholder="15:00" {...form.getInputProps("endTime")} />
            </Group>
            <Text size="xs" c="dimmed">Formato HH:MM en 24 horas. Déjalo vacío para todo el día.</Text>

            <Switch
              label="Promoción activa"
              checked={form.values.isActive}
              onChange={(e) => form.setFieldValue("isActive", e.currentTarget.checked)}
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" loading={loading}>{editing ? "Guardar" : "Crear"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal eliminar */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Eliminar promoción" centered size="sm">
        <Text size="sm" mb="lg">¿Eliminar <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancelar</Button>
          <Button color="red" loading={loading} onClick={handleDelete}>Eliminar</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
