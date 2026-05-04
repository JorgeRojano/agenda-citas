"use client";

import {
  Stack, Group, Text, Button, Badge, ActionIcon, Modal,
  TextInput, NumberInput, Switch, Select, Textarea,
  Checkbox, SimpleGrid, Card, Divider, Table, ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

type Promotion = {
  id:             string;
  name:           string;
  type:           string;
  description:    string | null;
  discountAmount: string | null;
  validDays:      string[];
  startTime:      string | null;
  endTime:        string | null;
  isActive:       boolean;
};

type Props = {
  slug:       string;
  promotions: Promotion[];
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

const emptyForm = {
  name:           "",
  type:           "special" as string,
  description:    "",
  discountAmount: null as number | null,
  validDays:      ["mon","tue","wed","thu","fri","sat","sun"] as string[],
  startTime:      "",
  endTime:        "",
  isActive:       true,
};

export default function PromotionsAdminClient({ slug, promotions: initial }: Props) {
  const [promotions, setPromotions]     = useState<Promotion[]>(initial);
  const [editing, setEditing]           = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [loading, setLoading]           = useState(false);

  const [formOpened,   { open: openForm,   close: closeForm }]   = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const base = `/api/business/${slug}/admin/menu/promotions`;

  const form = useForm({
    initialValues: emptyForm,
    validate: {
      name:      (v) => (!v.trim() ? "Nombre requerido" : null),
      type:      (v) => (!v ? "Tipo requerido" : null),
      validDays: (v) => (v.length === 0 ? "Selecciona al menos un día" : null),
    },
  });

  function openCreate() {
    setEditing(null);
    form.setValues(emptyForm);
    openForm();
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    form.setValues({
      name:           p.name,
      type:           p.type,
      description:    p.description ?? "",
      discountAmount: p.discountAmount ? Number(p.discountAmount) : null,
      validDays:      p.validDays,
      startTime:      p.startTime ?? "",
      endTime:        p.endTime ?? "",
      isActive:       p.isActive,
    });
    openForm();
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    const payload = {
      ...values,
      description:    values.description || undefined,
      discountAmount: values.discountAmount || undefined,
      startTime:      values.startTime || undefined,
      endTime:        values.endTime || undefined,
    };
    try {
      if (editing) {
        const res = await fetch(`${base}/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        setPromotions((prev) => prev.map((p) => p.id === editing.id
          ? { ...p, ...values, discountAmount: values.discountAmount ? String(values.discountAmount) : null, description: values.description || null, startTime: values.startTime || null, endTime: values.endTime || null }
          : p
        ));
        showNotification({ message: "Promoción actualizada", color: "teal" });
      } else {
        const res = await fetch(base, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setPromotions((prev) => [{
          ...created,
          discountAmount: created.discountAmount ? String(created.discountAmount) : null,
        }, ...prev]);
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
                <Table.Th>Días</Table.Th>
                <Table.Th>Horario</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {promotions.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text size="sm" fw={600}>{p.name}</Text>
                    {p.discountAmount && (
                      <Text size="xs" c="green">-${Number(p.discountAmount).toFixed(2)}</Text>
                    )}
                    {p.description && (
                      <Text size="xs" c="dimmed" lineClamp={1}>{p.description}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light">{TYPE_LABELS[p.type] ?? p.type}</Badge>
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
                    <Text size="xs" c="dimmed">
                      {p.startTime || p.endTime
                        ? `${p.startTime ?? "—"} → ${p.endTime ?? "—"}`
                        : "Todo el día"}
                    </Text>
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
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      {/* Modal crear/editar */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={editing ? "Editar promoción" : "Nueva promoción"}
        size="md"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label="Nombre" placeholder="Combo del mediodía..." required {...form.getInputProps("name")} />
            <Select label="Tipo" data={TYPE_OPTIONS} required {...form.getInputProps("type")} />
            <Textarea label="Descripción" placeholder="Detalle de la promoción..." autosize minRows={2} {...form.getInputProps("description")} />
            <NumberInput label="Descuento ($)" placeholder="0.00" prefix="$" decimalScale={2} min={0} {...form.getInputProps("discountAmount")} />

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
            <Text size="xs" c="dimmed">Formato HH:MM en 24 horas. Déjalo vacío para que aplique todo el día.</Text>

            <Switch label="Promoción activa" checked={form.values.isActive} onChange={(e) => form.setFieldValue("isActive", e.currentTarget.checked)} />

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
