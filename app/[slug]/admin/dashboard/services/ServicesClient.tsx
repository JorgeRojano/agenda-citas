"use client";

import {
  SimpleGrid,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Stack,
  Title,
  Switch,
  Checkbox,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { IconEdit, IconTrash, IconPlus, IconUsers } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import {
  createService,
  updateService,
  deleteService,
  assignResourcesToService,
} from "./actions";
import { showNotification } from "@mantine/notifications";
import { Service } from "@/types/Service";
import { Resource } from "@/types/Resource";

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface ServiceWithResources extends Service {
  resources: {
    profileId: string;
    profile: { id: string; name: string | null };
  }[];
}

interface Props {
  business: Business;
  services: ServiceWithResources[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #f59e0b, #f97316)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #3b82f6, #2563eb)",
    "linear-gradient(135deg, #ec4899, #db2777)",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function ServicesClient({
  business,
  services: initialServices,
}: Props) {
  const [services, setServices] =
    useState<ServiceWithResources[]>(initialServices);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  // Resources modal state
  const [resourcesService, setResourcesService] =
    useState<ServiceWithResources | null>(null);
  const [resourcesOpened, { open: openResources, close: closeResources }] =
    useDisclosure(false);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [savingResources, setSavingResources] = useState(false);

  const form = useForm({
    initialValues: { name: "", duration: 60, price: 0, showPrice: true },
    validate: {
      name: (v) => (v.trim().length < 2 ? "Nombre requerido" : null),
      duration: (v) => (v < 1 ? "Duración inválida" : null),
      price: (v) => (v < 0 ? "Precio inválido" : null),
    },
  });

  // Fetch all resources
  useEffect(() => {
    fetch(`/api/business/${business.slug}/staff`)
      .then((r) => r.json())
      .then(setAllResources);
  }, [business.slug]);

  const handleOpen = (service?: Service) => {
    if (service) {
      setEditingService(service);
      form.setValues({
        name: service.name,
        duration: service.duration,
        price: service.price / 100,
        showPrice: service.showPrice,
      });
    } else {
      setEditingService(null);
      form.reset();
    }
    open();
  };

  const handleOpenResources = (service: ServiceWithResources) => {
    setResourcesService(service);
    setSelectedResourceIds(service.resources.map((r) => r.profileId));
    openResources();
  };

  const handleToggleResource = (resourceId: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId],
    );
  };

  const handleSaveResources = async () => {
    if (!resourcesService) return;
    setSavingResources(true);
    try {
      await assignResourcesToService(
        business.id,
        resourcesService.id,
        selectedResourceIds,
      );
      setServices((prev) =>
        prev.map((s) =>
          s.id === resourcesService.id
            ? {
                ...s,
                resources: selectedResourceIds.map((id) => ({
                  profileId: id,
                  profile: {
                    id,
                    name: allResources.find((r) => r.id === id)?.name ?? "",
                  },
                })),
              }
            : s,
        ),
      );
      showNotification({
        title: "Guardado",
        message: "Recursos actualizados",
        color: "green",
      });
      closeResources();
    } catch {
      showNotification({
        title: "Error",
        message: "No se pudo guardar",
        color: "red",
      });
    } finally {
      setSavingResources(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (editingService) {
        await updateService(business.id, editingService.id, values);
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService.id
              ? { ...s, ...values, price: values.price * 100 }
              : s,
          ),
        );
        showNotification({
          title: "Guardado",
          message: "Servicio actualizado",
          color: "green",
        });
      } else {
        await createService(business.id, values);
        window.location.reload();
      }
      close();
    } catch {
      showNotification({
        title: "Error",
        message: "No se pudo guardar",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteService(business.id, deleteId);
      setServices((prev) => prev.filter((s) => s.id !== deleteId));
      showNotification({
        title: "Eliminado",
        message: "Servicio eliminado",
        color: "red",
      });
      closeDelete();
    } catch {
      showNotification({
        title: "Error",
        message: "No se pudo eliminar",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={3}>Servicios</Title>
          <Text size="sm" c="dimmed">
            {services.length} servicios activos
          </Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {services.map((service) => (
          <Card
            key={service.id}
            withBorder
            radius="md"
            padding={0}
            shadow="sm"
            style={{ overflow: "hidden" }}
          >
            {/* Body */}
            <div style={{ padding: "16px 18px 12px" }}>
              <Text fw={700} size="md" mb={8}>
                {service.name}
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="blue">
                  ⏱ {service.duration} min
                </Badge>
                {service.showPrice ? (
                  <Badge variant="light" color="green">
                    ${(service.price / 100).toFixed(2)}
                  </Badge>
                ) : (
                  <Badge variant="light" color="gray">
                    Precio oculto
                  </Badge>
                )}
              </Group>
            </div>

            {/* Resources section */}
            <div
              style={{
                padding: "10px 18px 12px",
                borderTop: "1px solid #f8fafc",
              }}
            >
              <Text
                size="xs"
                fw={700}
                c="dimmed"
                tt="uppercase"
                mb={8}
                style={{ letterSpacing: "0.06em" }}
              >
                Recursos asignados
              </Text>
              {service.resources.length === 0 ? (
                <Text size="xs" c="dimmed" fs="italic">
                  Sin recursos asignados
                </Text>
              ) : (
                <Group gap={6} style={{ flexWrap: "wrap" }}>
                  {service.resources.map((r) => (
                    <div
                      key={r.profileId}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#f3f0ff",
                        borderRadius: 99,
                        padding: "3px 8px",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: getAvatarColor(r.profile.name ?? "?"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(r.profile.name ?? "?")}
                      </div>
                      <Text size="xs" fw={600} style={{ color: "#7c3aed" }}>
                        {r.profile.name}
                      </Text>
                    </div>
                  ))}
                </Group>
              )}
            </div>

            {/* Footer */}
            <Stack gap={6} p="sm" style={{ paddingTop: 10 }}>
              <Button
                variant="light"
                color="violet"
                size="xs"
                fullWidth
                leftSection={<IconUsers size={14} />}
                onClick={() => handleOpenResources(service)}
              >
                Recursos
              </Button>
              <Group gap="xs">
                <Button
                  variant="light"
                  color="blue"
                  size="xs"
                  flex={1}
                  leftSection={<IconEdit size={14} />}
                  onClick={() => handleOpen(service)}
                >
                  Editar
                </Button>
                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  flex={1}
                  leftSection={<IconTrash size={14} />}
                  onClick={() => {
                    setDeleteId(service.id);
                    openDelete();
                  }}
                >
                  Eliminar
                </Button>
              </Group>
            </Stack>
          </Card>
        ))}

        <Card
          withBorder
          radius="md"
          padding="md"
          shadow="sm"
          onClick={() => handleOpen()}
          style={{
            border: "2px dashed #dee2e6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 160,
            background: "transparent",
          }}
        >
          <Stack align="center" gap="xs">
            <IconPlus size={28} color="#adb5bd" />
            <Text size="sm" fw={600} c="dimmed">
              Agregar servicio
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Modal crear/editar */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingService ? "Editar servicio" : "Nuevo servicio"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nombre"
              placeholder="Ej: Terapia de lenguaje"
              required
              {...form.getInputProps("name")}
            />
            <NumberInput
              label="Duración (minutos)"
              placeholder="60"
              min={1}
              required
              {...form.getInputProps("duration")}
            />
            <NumberInput
              label="Precio"
              placeholder="300"
              min={0}
              decimalScale={2}
              prefix="$"
              required
              {...form.getInputProps("price")}
            />
            <Switch
              label="Mostrar precio en la página de reservas"
              description="Si está desactivado, el precio no será visible para los clientes"
              checked={form.values.showPrice}
              onChange={(e) =>
                form.setFieldValue("showPrice", e.currentTarget.checked)
              }
            />
            <Button type="submit" loading={loading} fullWidth>
              {editingService ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Modal asignar recursos */}
      <Modal
        opened={resourcesOpened}
        onClose={closeResources}
        centered
        title={
          <div>
            <Text fw={700} size="sm">
              Asignar recursos
            </Text>
            <Text size="xs" c="dimmed">
              {resourcesService?.name} · {resourcesService?.duration} min
            </Text>
          </div>
        }
      >
        <Stack gap="xs">
          <Text size="xs" c="dimmed" mb={4}>
            Selecciona los recursos que pueden realizar este servicio
          </Text>

          {allResources.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No hay recursos configurados. Agrega recursos primero en la
              sección de Recursos.
            </Text>
          ) : (
            allResources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleToggleResource(resource.id as string)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: selectedResourceIds.includes(resource.id as string)
                    ? "#f5f3ff"
                    : "white",
                  border: `1.5px solid ${selectedResourceIds.includes(resource.id as string) ? "#7c3aed" : "#f1f5f9"}`,
                  transition: "all 0.1s",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: getAvatarColor(resource.name),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(resource.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={700}>
                    {resource.name}
                  </Text>
                  {resource.specialty && (
                    <Text size="xs" c="dimmed">
                      {resource.specialty}
                    </Text>
                  )}
                </div>
                <Checkbox
                  checked={selectedResourceIds.includes(resource.id as string)}
                  onChange={() => handleToggleResource(resource.id as string)}
                  color="violet"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))
          )}

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={closeResources}>
              Cancelar
            </Button>
            <Button
              color="violet"
              loading={savingResources}
              onClick={handleSaveResources}
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Eliminar servicio"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            ¿Estás seguro que deseas eliminar este servicio? Esta acción no se
            puede deshacer.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDelete}>
              Cancelar
            </Button>
            <Button color="red" loading={loading} onClick={handleDelete}>
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
