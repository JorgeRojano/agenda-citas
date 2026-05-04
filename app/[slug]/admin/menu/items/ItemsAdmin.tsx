"use client";

import {
  Stack, Group, Text, Button, Badge, ActionIcon, Modal, TextInput,
  NumberInput, Switch, Select, Textarea, MultiSelect, SegmentedControl,
  Table, ScrollArea, Checkbox, Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { useState } from "react";

type Category = { id: string; name: string; emoji: string };

type AvailableModifier = { id: string; name: string; selectionType: string; isRequired: boolean };

type Item = {
  id:            string;
  categoryId:    string;
  categoryName:  string;
  categoryEmoji: string;
  name:          string;
  description:   string | null;
  price:         string;
  originalPrice: string | null;
  emoji:         string | null;
  isActive:      boolean;
  isAvailable:   boolean;
  isPopular:     boolean;
  isVegetarian:  boolean;
  isGlutenFree:  boolean;
  spiceLevel:    number;
  allergens:     string[];
  modifierIds:   string[];
};

type Props = {
  slug:       string;
  categories: Category[];
  modifiers:  AvailableModifier[];
  items:      Item[];
};

const ALLERGEN_OPTIONS = [
  "Gluten","Lácteos","Huevo","Mariscos","Pescado",
  "Nueces","Maní","Soya","Apio","Mostaza","Sésamo","Sulfitos",
];

const SPICE_LEVELS = [
  { label: "Sin picante", value: "0" },
  { label: "🌶️ Leve",    value: "1" },
  { label: "🌶️🌶️ Medio", value: "2" },
  { label: "🌶️🌶️🌶️ Alto", value: "3" },
];

const emptyForm = {
  categoryId:   "",
  name:         "",
  description:  "",
  price:        0,
  originalPrice: null as number | null,
  emoji:        "",
  isActive:     true,
  isAvailable:  true,
  isPopular:    false,
  isVegetarian: false,
  isGlutenFree: false,
  spiceLevel:   "0",
  allergens:    [] as string[],
};

export default function ItemsAdmin({ slug, categories, modifiers, items: initial }: Props) {
  const [items, setItems]               = useState<Item[]>(initial);
  const [editing, setEditing]           = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [search, setSearch]             = useState("");
  const [filterCat, setFilterCat]       = useState<string>("all");
  const [loading, setLoading]           = useState(false);

  const [formOpened,   { open: openForm,   close: closeForm }]   = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const base = `/api/business/${slug}/admin/menu/items`;

  const form = useForm({
    initialValues: emptyForm,
    validate: {
      categoryId: (v) => (!v ? "Selecciona una categoría" : null),
      name:       (v) => (v.trim().length < 1 ? "Nombre requerido" : null),
      price:      (v) => (v <= 0 ? "Precio inválido" : null),
    },
  });

  function openCreate() {
    setEditing(null);
    setSelectedModifierIds([]);
    form.setValues({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    openForm();
  }

  function openEdit(item: Item) {
    setEditing(item);
    setSelectedModifierIds(item.modifierIds);
    form.setValues({
      categoryId:    item.categoryId,
      name:          item.name,
      description:   item.description ?? "",
      price:         Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
      emoji:         item.emoji ?? "",
      isActive:      item.isActive,
      isAvailable:   item.isAvailable,
      isPopular:     item.isPopular,
      isVegetarian:  item.isVegetarian,
      isGlutenFree:  item.isGlutenFree,
      spiceLevel:    String(item.spiceLevel),
      allergens:     item.allergens,
    });
    openForm();
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    const payload = {
      ...values,
      spiceLevel:    Number(values.spiceLevel),
      originalPrice: values.originalPrice || null,
      description:   values.description || null,
      emoji:         values.emoji || null,
    };
    try {
      if (editing) {
        const res = await fetch(`${base}/${editing.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        await fetch(`${base}/${editing.id}/modifiers`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ modifierIds: selectedModifierIds }),
        });
        const cat = categories.find((c) => c.id === values.categoryId)!;
        setItems((prev) => prev.map((i) => i.id === editing.id
          ? { ...i, ...payload, price: String(payload.price), originalPrice: payload.originalPrice ? String(payload.originalPrice) : null, categoryName: cat.name, categoryEmoji: cat.emoji, modifierIds: selectedModifierIds }
          : i
        ));
        showNotification({ message: "Platillo actualizado", color: "teal" });
      } else {
        const res = await fetch(base, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        if (selectedModifierIds.length > 0) {
          await fetch(`${base}/${created.id}/modifiers`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ modifierIds: selectedModifierIds }),
          });
        }
        const cat = categories.find((c) => c.id === values.categoryId)!;
        setItems((prev) => [...prev, {
          ...created,
          price:         String(created.price),
          originalPrice: created.originalPrice ? String(created.originalPrice) : null,
          categoryName:  cat.name,
          categoryEmoji: cat.emoji,
          modifierIds:   selectedModifierIds,
        }]);
        showNotification({ message: "Platillo creado", color: "teal" });
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
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      showNotification({ message: "Platillo eliminado", color: "teal" });
      closeDelete();
    } catch {
      showNotification({ message: "Error al eliminar", color: "red" });
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter((i) => {
    const matchCat  = filterCat === "all" || i.categoryId === filterCat;
    const matchText = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  const categoryOptions = [
    { value: "all", label: "Todas las categorías" },
    ...categories.map((c) => ({ value: c.id, label: `${c.emoji} ${c.name}` })),
  ];

  return (
    <Stack gap="md" p="md">
      <Group justify="space-between">
        <div>
          <Text fw={700} size="xl">Platillos</Text>
          <Text size="sm" c="dimmed">{items.length} platillos en total</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Nuevo platillo
        </Button>
      </Group>

      {/* Filtros */}
      <Group gap="sm">
        <TextInput
          placeholder="Buscar platillo..."
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          data={categoryOptions}
          value={filterCat}
          onChange={(v) => setFilterCat(v ?? "all")}
          style={{ minWidth: 200 }}
        />
      </Group>

      {/* Tabla */}
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Platillo</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>Precio</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: "center", color: "var(--mantine-color-dimmed)", padding: "32px" }}>
                  Sin platillos
                </Table.Td>
              </Table.Tr>
            ) : filtered.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Group gap="sm">
                    <Text style={{ fontSize: 22 }}>{item.emoji ?? "🍽️"}</Text>
                    <div>
                      <Text size="sm" fw={600}>{item.name}</Text>
                      {item.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>{item.description}</Text>
                      )}
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{item.categoryEmoji} {item.categoryName}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>${Number(item.price).toFixed(2)}</Text>
                  {item.originalPrice && (
                    <Text size="xs" c="dimmed" style={{ textDecoration: "line-through" }}>
                      ${Number(item.originalPrice).toFixed(2)}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <Badge size="xs" color={item.isActive ? "teal" : "gray"} variant="light">
                      {item.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    {!item.isAvailable && (
                      <Badge size="xs" color="orange" variant="light">Agotado</Badge>
                    )}
                    {item.isPopular && (
                      <Badge size="xs" color="yellow" variant="light">⭐ Popular</Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} justify="flex-end">
                    <ActionIcon variant="subtle" onClick={() => openEdit(item)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => { setDeleteTarget(item); openDelete(); }}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Modal crear/editar */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={editing ? "Editar platillo" : "Nuevo platillo"}
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Categoría"
              required
              data={categories.map((c) => ({ value: c.id, label: `${c.emoji} ${c.name}` }))}
              {...form.getInputProps("categoryId")}
            />
            <Group grow>
              <TextInput label="Nombre" placeholder="Tacos de pastor..." required {...form.getInputProps("name")} />
              <TextInput label="Emoji" placeholder="🌮" {...form.getInputProps("emoji")} />
            </Group>
            <Textarea label="Descripción" placeholder="Descripción breve..." autosize minRows={2} {...form.getInputProps("description")} />
            <Group grow>
              <NumberInput label="Precio" prefix="$" decimalScale={2} min={0.01} required {...form.getInputProps("price")} />
              <NumberInput label="Precio original (tachado)" prefix="$" decimalScale={2} min={0} {...form.getInputProps("originalPrice")} />
            </Group>
            <div>
              <Text size="sm" fw={500} mb={4}>Nivel de picante</Text>
              <SegmentedControl
                fullWidth
                data={SPICE_LEVELS}
                {...form.getInputProps("spiceLevel")}
              />
            </div>
            <MultiSelect
              label="Alérgenos"
              data={ALLERGEN_OPTIONS}
              placeholder="Selecciona los alérgenos..."
              {...form.getInputProps("allergens")}
            />
            <Group grow>
              <Switch label="Activo en menú"    checked={form.values.isActive}    onChange={(e) => form.setFieldValue("isActive",    e.currentTarget.checked)} />
              <Switch label="Disponible"         checked={form.values.isAvailable} onChange={(e) => form.setFieldValue("isAvailable", e.currentTarget.checked)} />
            </Group>
            <Group grow>
              <Switch label="⭐ Popular"          checked={form.values.isPopular}   onChange={(e) => form.setFieldValue("isPopular",   e.currentTarget.checked)} />
              <Switch label="🌿 Vegetariano"      checked={form.values.isVegetarian} onChange={(e) => form.setFieldValue("isVegetarian", e.currentTarget.checked)} />
              <Switch label="🌾 Sin gluten"       checked={form.values.isGlutenFree} onChange={(e) => form.setFieldValue("isGlutenFree", e.currentTarget.checked)} />
            </Group>
            {modifiers.length > 0 && (
              <>
                <Divider label="Modificadores" labelPosition="left" />
                <Stack gap="xs">
                  {modifiers.map((mod) => (
                    <Checkbox
                      key={mod.id}
                      label={
                        <Group gap="xs">
                          <Text size="sm">{mod.name}</Text>
                          <Badge size="xs" variant="light" color="blue">
                            {mod.selectionType === "single" ? "Única" : "Múltiple"}
                          </Badge>
                          {mod.isRequired && <Badge size="xs" variant="light" color="red">Req.</Badge>}
                        </Group>
                      }
                      checked={selectedModifierIds.includes(mod.id)}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setSelectedModifierIds((prev) =>
                          checked ? [...prev, mod.id] : prev.filter((id) => id !== mod.id)
                        );
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" loading={loading}>{editing ? "Guardar" : "Crear"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Eliminar platillo" centered size="sm">
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
