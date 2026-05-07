"use client";

import {
  Stack, Group, Text, Button, Card, Badge, ActionIcon,
  Modal, TextInput, NumberInput, Switch, SimpleGrid, Tooltip, Popover,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

const FOOD_EMOJIS = [
  "🍕","🍔","🌮","🌯","🥙","🥗","🍜","🍝","🍛","🍲","🥘","🫕",
  "🍣","🍱","🍤","🦞","🦐","🥩","🍗","🥓","🌭","🥪","🧆","🥚",
  "🥞","🧇","🥐","🍞","🥖","🧀","🫔","🥨","🧂","🫙",
  "🍰","🎂","🧁","🍮","🍭","🍬","🍫","🍩","🍪","🍦","🍧","🍨",
  "🍎","🍊","🍋","🍇","🍓","🫐","🍑","🍒","🍍","🥭","🍌","🍉",
  "🥑","🥦","🫑","🌽","🥕","🧅","🥔","🍆","🍅","🫒","🥬","🥒",
  "☕","🍵","🧃","🥤","🧋","🍺","🍻","🥂","🍷","🍸","🍹","🧉",
  "🍽️","🥄","🍴","🔪","🧊","🫖","🥢","🛒",
];


type Category = {
  id:           string;
  name:         string;
  emoji:        string;
  displayOrder: number;
  isActive:     boolean;
  itemCount:    number;
};

type Props = {
  slug:       string;
  categories: Category[];
};

export default function CategoriesAdmin({ slug, categories: initial }: Props) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [editing, setEditing]       = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [loading, setLoading]       = useState(false);

  const [formOpened,   { open: openForm,   close: closeForm }]     = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }]   = useDisclosure(false);

  const base = `/api/business/${slug}/admin/menu/categories`;

  const form = useForm({
    initialValues: { name: "", emoji: "🍽️", displayOrder: 0, isActive: true },
    validate: {
      name:  (v) => (v.trim().length < 1 ? "Nombre requerido" : null),
      emoji: (v) => (v.trim().length < 1 ? "Emoji requerido" : null),
    },
  });

  function openCreate() {
    setEditing(null);
    form.setValues({ name: "", emoji: "🍽️", displayOrder: categories.length, isActive: true });
    openForm();
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    form.setValues({ name: cat.name, emoji: cat.emoji, displayOrder: cat.displayOrder, isActive: cat.isActive });
    openForm();
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      if (editing) {
        const res = await fetch(`${base}/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error();
        setCategories((prev) =>
          prev.map((c) => c.id === editing.id ? { ...c, ...values } : c)
        );
        showNotification({ message: "Categoría actualizada", color: "teal" });
      } else {
        const res = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setCategories((prev) => [...prev, { ...created, itemCount: 0 }]);
        showNotification({ message: "Categoría creada", color: "teal" });
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
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showNotification({ message: "Categoría eliminada", color: "teal" });
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
          <Text fw={700} size="xl">Categorías</Text>
          <Text size="sm" c="dimmed">{categories.length} categorías</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Nueva categoría
        </Button>
      </Group>

      {categories.length === 0 ? (
        <Card withBorder radius="md" p="xl" style={{ textAlign: "center" }}>
          <Text c="dimmed" mb="md">Aún no tienes categorías</Text>
          <Button onClick={openCreate} leftSection={<IconPlus size={16} />}>
            Crear primera categoría
          </Button>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
          {categories.map((cat) => (
            <Card key={cat.id} withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Group gap="sm">
                  <Text size="2rem" lh={1}>{cat.emoji}</Text>
                  <div>
                    <Text fw={600} size="sm">{cat.name}</Text>
                    <Text size="xs" c="dimmed">{cat.itemCount} platillos</Text>
                  </div>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="subtle" onClick={() => openEdit(cat)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <Tooltip
                    label={`Elimina los ${cat.itemCount} platillos primero`}
                    disabled={cat.itemCount === 0}
                    withArrow
                  >
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => { setDeleteTarget(cat); openDelete(); }}
                      disabled={cat.itemCount > 0}
                      data-disabled={cat.itemCount > 0}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
              <Group gap="xs" mt="xs">
                <Badge size="xs" variant="light" color="gray">Orden: {cat.displayOrder}</Badge>
                <Badge size="xs" variant="light" color={cat.isActive ? "teal" : "red"}>
                  {cat.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Modal crear/editar */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label="Nombre" placeholder="Entradas, Bebidas..." required {...form.getInputProps("name")} />
            <div>
              <Text size="sm" fw={500} mb={4}>Emoji</Text>
              <Popover width="auto" position="right" withArrow shadow="md">
                <Popover.Target>
                  <Button variant="default" size="sm" style={{ fontSize: 22, minWidth: 56 }}>
                    {form.values.emoji}
                  </Button>
                </Popover.Target>
                <Popover.Dropdown p="xs">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
                    {FOOD_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => form.setFieldValue("emoji", e)}
                        style={{
                          background: form.values.emoji === e ? "var(--mantine-color-blue-1)" : "transparent",
                          border: "none", borderRadius: 6, padding: 4,
                          fontSize: 20, cursor: "pointer", lineHeight: 1,
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </Popover.Dropdown>
              </Popover>
            </div>
            <NumberInput label="Orden de aparición" min={0} {...form.getInputProps("displayOrder")} />
            <Switch label="Categoría activa" checked={form.values.isActive} onChange={(e) => form.setFieldValue("isActive", e.currentTarget.checked)} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" loading={loading}>{editing ? "Guardar" : "Crear"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Eliminar categoría" centered size="sm">
        <Text size="sm" mb="lg">
          ¿Eliminar <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancelar</Button>
          <Button color="red" loading={loading} onClick={handleDelete}>Eliminar</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
