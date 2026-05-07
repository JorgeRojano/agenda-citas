"use client";

import {
  Stack, Group, Text, Button, Badge, ActionIcon, Modal,
  TextInput, NumberInput, Switch, SegmentedControl, Card,
  SimpleGrid, Divider, Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconGripVertical } from "@tabler/icons-react";
import { useState } from "react";

type Option = {
  id:           string;
  name:         string;
  extraPrice:   string;
  displayOrder: number;
};

type Modifier = {
  id:            string;
  name:          string;
  selectionType: string;
  isRequired:    boolean;
  usedByItems:   number;
  options:       Option[];
};

type DraftOption = { name: string; extraPrice: number };

type Props = {
  slug:      string;
  modifiers: Modifier[];
};

export default function ModifiersAdmin({ slug, modifiers: initial }: Props) {
  const [modifiers, setModifiers]   = useState<Modifier[]>(initial);
  const [editing, setEditing]       = useState<Modifier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Modifier | null>(null);
  const [loading, setLoading]       = useState(false);

  // Form state
  const [name, setName]                   = useState("");
  const [selectionType, setSelectionType] = useState("single");
  const [isRequired, setIsRequired]       = useState(false);
  const [options, setOptions]             = useState<DraftOption[]>([{ name: "", extraPrice: 0 }]);

  const [formOpened,   { open: openForm,   close: closeForm }]   = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const base = `/api/business/${slug}/admin/menu/modifiers`;

  function resetForm() {
    setName(""); setSelectionType("single"); setIsRequired(false);
    setOptions([{ name: "", extraPrice: 0 }]);
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    openForm();
  }

  function openEdit(mod: Modifier) {
    setEditing(mod);
    setName(mod.name);
    setSelectionType(mod.selectionType);
    setIsRequired(mod.isRequired);
    setOptions(mod.options.map((o) => ({ name: o.name, extraPrice: Number(o.extraPrice) })));
    openForm();
  }

  function addOption() {
    setOptions((prev) => [...prev, { name: "", extraPrice: 0 }]);
  }

  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateOption(idx: number, field: keyof DraftOption, value: string | number) {
    setOptions((prev) => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      showNotification({ message: "El nombre es requerido", color: "red" });
      return;
    }
    if (options.some((o) => !o.name.trim())) {
      showNotification({ message: "Todas las opciones deben tener nombre", color: "red" });
      return;
    }
    setLoading(true);
    const payload = {
      name, selectionType, isRequired,
      options: options.map((o, i) => ({ name: o.name, extraPrice: o.extraPrice, displayOrder: i })),
    };
    try {
      if (editing) {
        const res = await fetch(`${base}/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        setModifiers((prev) => prev.map((m) => m.id === editing.id
          ? { ...m, ...payload, options: options.map((o, i) => ({ id: `draft-${i}`, ...o, extraPrice: String(o.extraPrice), displayOrder: i })) }
          : m
        ));
        showNotification({ message: "Modificador actualizado", color: "teal" });
      } else {
        const res = await fetch(base, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setModifiers((prev) => [...prev, {
          ...created,
          usedByItems: 0,
          options: (created.options ?? []).map((o: { id: string; name: string; extraPrice: string | number; displayOrder: number }) => ({
            ...o, extraPrice: String(o.extraPrice),
          })),
        }]);
        showNotification({ message: "Modificador creado", color: "teal" });
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
      setModifiers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      showNotification({ message: "Modificador eliminado", color: "teal" });
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
          <Text fw={700} size="xl">Modificadores</Text>
          <Text size="sm" c="dimmed">{modifiers.length} grupos de opciones</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Nuevo modificador
        </Button>
      </Group>

      {modifiers.length === 0 ? (
        <Card withBorder radius="md" p="xl" style={{ textAlign: "center" }}>
          <Text c="dimmed" mb="md">Aún no tienes modificadores</Text>
          <Button onClick={openCreate} leftSection={<IconPlus size={16} />}>Crear primero</Button>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
          {modifiers.map((mod) => (
            <Card key={mod.id} withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">{mod.name}</Text>
                <Group gap={4}>
                  <ActionIcon variant="subtle" onClick={() => openEdit(mod)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <Tooltip label={`Usado en ${mod.usedByItems} platillo(s)`} disabled={mod.usedByItems === 0} withArrow>
                    <ActionIcon
                      variant="subtle" color="red"
                      onClick={() => { setDeleteTarget(mod); openDelete(); }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
              <Group gap="xs" mb="xs">
                <Badge size="xs" variant="light" color="blue">
                  {mod.selectionType === "single" ? "Selección única" : "Múltiple"}
                </Badge>
                {mod.isRequired && <Badge size="xs" variant="light" color="red">Requerido</Badge>}
                {mod.usedByItems > 0 && (
                  <Badge size="xs" variant="light" color="gray">{mod.usedByItems} platillo(s)</Badge>
                )}
              </Group>
              <Divider mb="xs" />
              <Stack gap={4}>
                {mod.options.map((o) => (
                  <Group key={o.id} justify="space-between">
                    <Text size="xs">{o.name}</Text>
                    <Text size="xs" c="dimmed">
                      {Number(o.extraPrice) > 0 ? `+$${Number(o.extraPrice).toFixed(2)}` : "Sin costo"}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Modal crear/editar */}
      <Modal opened={formOpened} onClose={closeForm} title={editing ? "Editar modificador" : "Nuevo modificador"} size="md" centered>
        <Stack gap="sm">
          <TextInput label="Nombre del grupo" placeholder="Ej: Tamaño, Salsa, Extras..." required value={name} onChange={(e) => setName(e.currentTarget.value)} />

          <div>
            <Text size="sm" fw={500} mb={4}>Tipo de selección</Text>
            <SegmentedControl
              fullWidth
              value={selectionType}
              onChange={setSelectionType}
              data={[
                { label: "Única (radio)",        value: "single" },
                { label: "Múltiple (checkbox)", value: "multiple" },
              ]}
            />
          </div>

          <Switch label="Selección requerida" checked={isRequired} onChange={(e) => setIsRequired(e.currentTarget.checked)} />

          <Divider label="Opciones" labelPosition="left" />

          <Stack gap="xs">
            {options.map((opt, idx) => (
              <Group key={idx} gap="xs">
                <IconGripVertical size={14} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                <TextInput
                  placeholder="Nombre de la opción"
                  value={opt.name}
                  onChange={(e) => updateOption(idx, "name", e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <NumberInput
                  placeholder="0.00"
                  prefix="$"
                  decimalScale={2}
                  min={0}
                  value={opt.extraPrice}
                  onChange={(v) => updateOption(idx, "extraPrice", Number(v) || 0)}
                  style={{ width: 100 }}
                />
                <ActionIcon
                  variant="subtle" color="red" size="sm"
                  onClick={() => removeOption(idx)}
                  disabled={options.length === 1}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>

          <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={addOption}>
            Agregar opción
          </Button>

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancelar</Button>
            <Button loading={loading} onClick={handleSubmit}>{editing ? "Guardar" : "Crear"}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal eliminar */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Eliminar modificador" centered size="sm">
        <Text size="sm" mb="lg">
          ¿Eliminar <strong>{deleteTarget?.name}</strong>?
          {deleteTarget && deleteTarget.usedByItems > 0 && (
            <Text span c="orange" size="sm"> Se quitará de {deleteTarget.usedByItems} platillo(s).</Text>
          )}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancelar</Button>
          <Button color="red" loading={loading} onClick={handleDelete}>Eliminar</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
