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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { createService, updateService, deleteService } from "./actions";
import { showNotification } from "@mantine/notifications";
import { Service } from "@/types/Service";

interface Business {
  id: string;
  name: string;
}

interface Props {
  business: Business;
  services: Service[];
}

export default function ServicesClient({ business, services: initialServices }: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const form = useForm({
    initialValues: { name: "", duration: 60, price: 0, showPrice: true },
    validate: {
      name: (v) => v.trim().length < 2 ? "Nombre requerido" : null,
      duration: (v) => v < 1 ? "Duración inválida" : null,
      price: (v) => v < 0 ? "Precio inválido" : null,
    },
  });

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

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (editingService) {
        await updateService(business.id, editingService.id, values);
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService.id
              ? { ...s, ...values, price: values.price * 100 }
              : s
          )
        );
        showNotification({ title: "Guardado", message: "Servicio actualizado", color: "green" });
      } else {
        await createService(business.id, values);
        window.location.reload();
      }
      close();
    } catch {
      showNotification({ title: "Error", message: "No se pudo guardar", color: "red" });
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
      showNotification({ title: "Eliminado", message: "Servicio eliminado", color: "red" });
      closeDelete();
    } catch {
      showNotification({ title: "Error", message: "No se pudo eliminar", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={3}>Servicios</Title>
          <Text size="sm" c="dimmed">{services.length} servicios activos</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {services.map((service) => (
          <Card key={service.id} withBorder radius="md" padding="md" shadow="sm">
            <Stack gap="sm">
              <Text fw={700} size="md">{service.name}</Text>
              <Group gap="xs">
                <Badge variant="light" color="blue">⏱ {service.duration} min</Badge>
                {service.showPrice ? (
                  <Badge variant="light" color="green">
                    ${(service.price / 100).toFixed(2)}
                  </Badge>
                ) : (
                  <Badge variant="light" color="gray">Precio oculto</Badge>
                )}
              </Group>
              <Group gap="xs" mt="xs">
                <Button
                  variant="light" color="blue" size="xs" flex={1}
                  leftSection={<IconEdit size={14} />}
                  onClick={() => handleOpen(service)}
                >
                  Editar
                </Button>
                <Button
                  variant="light" color="red" size="xs" flex={1}
                  leftSection={<IconTrash size={14} />}
                  onClick={() => { setDeleteId(service.id); openDelete(); }}
                >
                  Eliminar
                </Button>
              </Group>
            </Stack>
          </Card>
        ))}

        <Card
          withBorder radius="md" padding="md" shadow="sm"
          onClick={() => handleOpen()}
          style={{
            border: "2px dashed #dee2e6", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 130, background: "transparent",
          }}
        >
          <Stack align="center" gap="xs">
            <IconPlus size={28} color="#adb5bd" />
            <Text size="sm" fw={600} c="dimmed">Agregar servicio</Text>
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
              {...form.getInputProps("name")}
              required
            />
            <NumberInput
              label="Duración (minutos)"
              placeholder="60"
              min={1}
              {...form.getInputProps("duration")}
              required
            />
            <NumberInput
              label="Precio"
              placeholder="300"
              min={0}
              decimalScale={2}
              prefix="$"
              {...form.getInputProps("price")}
              required
            />
            {/* 👇 Switch para mostrar/ocultar precio */}
            <Switch
              label="Mostrar precio en la página de reservas"
              description="Si está desactivado, el precio no será visible para los clientes"
              checked={form.values.showPrice}
              onChange={(e) => form.setFieldValue("showPrice", e.currentTarget.checked)}
            />
            <Button type="submit" loading={loading} fullWidth>
              {editingService ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </Stack>
        </form>
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
          <Text size="sm">¿Estás seguro que deseas eliminar este servicio? Esta acción no se puede deshacer.</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDelete}>Cancelar</Button>
            <Button color="red" loading={loading} onClick={handleDelete}>Eliminar</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}