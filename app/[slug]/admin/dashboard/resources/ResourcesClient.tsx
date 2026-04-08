"use client";

import {
  SimpleGrid, Card, Text, Group, Badge, Button, Modal,
  TextInput, PasswordInput, Stack, Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { IconPlus, IconEdit, IconTrash, IconClock, IconKey } from "@tabler/icons-react";
import { useState } from "react";
import { showNotification } from "@mantine/notifications";
import { createStaffMember, updateStaffMember, deleteStaffMember, changeStaffPassword } from "./actions";
import { ResourceAvailabilityModal } from "./ResourceAvailabilityModal";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface StaffMember {
  id: string; name: string; email: string; specialty: string;
  role: string; activeDays?: number[];
  activeVacation?: { name: string | null; start: Date; end: Date } | null;
}

interface Props {
  business: { id: string; name: string };
  businessSchedule: { dayOfWeek: number; startTime: string; endTime: string }[];
  staff: StaffMember[];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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

export default function ResourcesClient({ business, businessSchedule, staff: initialStaff }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [loading, setLoading] = useState(false);

  const [availTarget, setAvailTarget] = useState<StaffMember | null>(null);
  const [availOpened, { open: openAvail, close: closeAvail }] = useDisclosure(false);

  const handleOpenAvail = (member: StaffMember) => { setAvailTarget(member); openAvail(); };
  const handleAvailSaved = (activeDays: number[]) => {
    if (!availTarget) return;
    setStaff((prev) => prev.map((s) => s.id === availTarget.id ? { ...s, activeDays } : s));
  };

  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: { name: "", email: "", password: "", specialty: "" },
    validate: {
      name:     (v) => (v.trim().length < 2 ? "Nombre requerido" : null),
      email:    (v) => (!/^\S+@\S+$/.test(v) ? "Email inválido" : null),
      password: (v) => (v.length < 6 ? "Mínimo 6 caracteres" : null),
    },
  });

  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const editForm = useForm({
    initialValues: { name: "", email: "", specialty: "" },
    validate: {
      name:  (v) => (v.trim().length < 2 ? "Nombre requerido" : null),
      email: (v) => (!/^\S+@\S+$/.test(v) ? "Email inválido" : null),
    },
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const [pwdTarget, setPwdTarget] = useState<StaffMember | null>(null);
  const [pwdOpened, { open: openPwd, close: closePwd }] = useDisclosure(false);
  const pwdForm = useForm({
    initialValues: { password: "", confirm: "" },
    validate: {
      password: (v) => (v.length < 6 ? "Mínimo 6 caracteres" : null),
      confirm:  (v, values) => (v !== values.password ? "Las contraseñas no coinciden" : null),
    },
  });

  const handleOpenPwd = (member: StaffMember) => { setPwdTarget(member); pwdForm.reset(); openPwd(); };

  const handleChangePwd = async (values: typeof pwdForm.values) => {
    if (!pwdTarget) return;
    setLoading(true);
    try {
      await changeStaffPassword(business.id, pwdTarget.id, values.password);
      showNotification({ title: "Contraseña actualizada", message: `La contraseña de ${pwdTarget.name} fue cambiada`, color: "green" });
      closePwd();
    } catch (error: any) {
      showNotification({ title: "Error", message: error.message, color: "red" });
    } finally { setLoading(false); }
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingMember(member);
    editForm.setValues({ name: member.name, email: member.email, specialty: member.specialty });
    openEdit();
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await createStaffMember(business.id, values);
      showNotification({ title: "Recurso creado", message: `${values.name} fue agregado exitosamente`, color: "green" });
      form.reset(); close(); window.location.reload();
    } catch (error: any) {
      showNotification({ title: "Error", message: error.message, color: "red" });
    } finally { setLoading(false); }
  };

  const handleEdit = async (values: typeof editForm.values) => {
    if (!editingMember) return;
    setLoading(true);
    try {
      await updateStaffMember(business.id, editingMember.id, values);
      setStaff((prev) => prev.map((s) => s.id === editingMember.id ? { ...s, ...values } : s));
      showNotification({ title: "Guardado", message: "Recurso actualizado", color: "green" });
      closeEdit();
    } catch (error: any) {
      showNotification({ title: "Error", message: error.message, color: "red" });
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteStaffMember(business.id, deleteId);
      setStaff((prev) => prev.filter((s) => s.id !== deleteId));
      showNotification({ title: "Eliminado", message: "Recurso eliminado", color: "red" });
      closeDelete();
    } catch (error: any) {
      showNotification({ title: "Error", message: error.message, color: "red" });
    } finally { setLoading(false); }
  };

  return (
    <>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={3}>Recursos</Title>
          <Text size="sm" c="dimmed">Gestiona los terapeutas y colaboradores de tu negocio</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {staff.map((member) => {
          const activeDays = member.activeDays ?? [];
          const onVacation = !!member.activeVacation;
          const vacationLabel = member.activeVacation?.name ?? "Vacaciones";

          return (
            <Card key={member.id} withBorder radius="md" padding={0} shadow="sm" style={{ overflow: "hidden" }}>
              {/* Info principal — sin badge de esquina */}
              <Stack align="center" gap="xs" p="md" pb="sm" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: getAvatarColor(member.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700, color: "white",
                }}>
                  {getInitials(member.name)}
                </div>
                <div style={{ textAlign: "center" }}>
                  <Text fw={700} size="sm">{member.name}</Text>
                  <Text size="xs" c="dimmed">{member.email}</Text>
                </div>
                <Group gap={6}>
                  {member.role === "ADMIN" && <Badge variant="light" color="violet" size="sm">Admin</Badge>}
                  {member.specialty && <Badge variant="light" color="blue" size="sm">{member.specialty}</Badge>}
                </Group>
              </Stack>

              {/* Disponibilidad — pill de vacaciones inline con el label */}
              <Stack gap={4} px="md" py="xs" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Disponibilidad
                  </Text>
                  {onVacation && (
                    <Badge variant="light" color="orange" size="xs">
                      🌴 {vacationLabel}
                    </Badge>
                  )}
                </Group>
                {activeDays.length === 0 ? (
                  <Text size="xs" c="red.4" fs="italic">Sin horario configurado</Text>
                ) : (
                  <Group gap={4}>
                    {DAY_LABELS.map((label, dow) => {
                      const isActive = activeDays.includes(dow);
                      return (
                        <div
                          key={dow}
                          style={{
                            fontSize: 10, fontWeight: 700,
                            padding: "2px 6px", borderRadius: 6,
                            background: "var(--mantine-color-green-light)",
                            color: "var(--mantine-color-green-light-color)",
                            opacity: isActive ? 1 : 0.45,
                          }}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </Group>
                )}
              </Stack>

              <Stack gap={6} p="sm">
                <Button variant="light" color="green" size="xs" fullWidth leftSection={<IconClock size={13} />} onClick={() => handleOpenAvail(member)}>
                  Disponibilidad
                </Button>
                {member.role !== "ADMIN" && (
                  <Group gap="xs">
                    <Button variant="light" color="blue" size="xs" flex={1} leftSection={<IconEdit size={13} />} onClick={() => handleOpenEdit(member)}>Editar</Button>
                    <Button variant="light" color="yellow" size="xs" flex={1} leftSection={<IconKey size={13} />} onClick={() => handleOpenPwd(member)}>Contraseña</Button>
                    <Button variant="light" color="red" size="xs" flex={1} leftSection={<IconTrash size={13} />} onClick={() => { setDeleteId(member.id); openDelete(); }}>Eliminar</Button>
                  </Group>
                )}
              </Stack>
            </Card>
          );
        })}

        <Card
          withBorder radius="md" padding="md" shadow="sm" onClick={open}
          style={{
            border: "2px dashed var(--mantine-color-default-border)",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", minHeight: 180, background: "transparent",
          }}
        >
          <Stack align="center" gap="xs">
            <IconPlus size={28} color="var(--mantine-color-dimmed)" />
            <Text size="sm" fw={600} c="dimmed">Agregar recurso</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {availTarget && (
        <ResourceAvailabilityModal
          opened={availOpened}
          onClose={closeAvail}
          profileId={availTarget.id}
          profileName={availTarget.name}
          avatarColor={getAvatarColor(availTarget.name)}
          initials={getInitials(availTarget.name)}
          onSaved={handleAvailSaved}
          businessSchedule={businessSchedule}
        />
      )}

      {/* Modal crear */}
      <Modal opened={opened} onClose={close} title="Nuevo recurso" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <div style={{
              background: "var(--mantine-color-blue-light)",
              border: "1px solid var(--mantine-color-blue-light-hover)",
              borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8,
            }}>
              <Text size="xs">ℹ️</Text>
              <Text size="xs" c="blue.7">Se creará una cuenta de acceso para este recurso con las credenciales que ingreses.</Text>
            </div>
            <TextInput label="Nombre completo" placeholder="Ej: Ana Martínez" required {...form.getInputProps("name")} />
            <TextInput label="Email" placeholder="ana@correo.com" required {...form.getInputProps("email")} />
            <PasswordInput label="Contraseña" placeholder="Mínimo 6 caracteres" required {...form.getInputProps("password")} />
            <TextInput label="Especialidad (opcional)" placeholder="Ej: Terapeuta de lenguaje" {...form.getInputProps("specialty")} />
            <Button type="submit" loading={loading} fullWidth>Crear recurso</Button>
          </Stack>
        </form>
      </Modal>

      {/* Modal editar */}
      <Modal opened={editOpened} onClose={closeEdit} title="Editar recurso" centered>
        <form onSubmit={editForm.onSubmit(handleEdit)}>
          <Stack gap="md">
            <TextInput label="Nombre completo" required {...editForm.getInputProps("name")} />
            <TextInput label="Email" required {...editForm.getInputProps("email")} />
            <TextInput label="Especialidad (opcional)" placeholder="Ej: Terapeuta de lenguaje" {...editForm.getInputProps("specialty")} />
            <Button type="submit" loading={loading} fullWidth>Guardar cambios</Button>
          </Stack>
        </form>
      </Modal>

      {/* Modal cambiar contraseña */}
      <Modal opened={pwdOpened} onClose={closePwd} title={`Cambiar contraseña — ${pwdTarget?.name}`} centered size="sm">
        <form onSubmit={pwdForm.onSubmit(handleChangePwd)}>
          <Stack gap="md">
            <PasswordInput label="Nueva contraseña" placeholder="Mínimo 6 caracteres" required {...pwdForm.getInputProps("password")} />
            <PasswordInput label="Confirmar contraseña" placeholder="Repite la contraseña" required {...pwdForm.getInputProps("confirm")} />
            <Button type="submit" loading={loading} fullWidth>Cambiar contraseña</Button>
          </Stack>
        </form>
      </Modal>

      {/* Modal eliminar */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Eliminar recurso" centered size="sm">
        <Stack gap="md">
          <Text size="sm">¿Estás seguro? Esta acción eliminará la cuenta de acceso del recurso y no se puede deshacer.</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDelete}>Cancelar</Button>
            <Button color="red" loading={loading} onClick={handleDelete}>Eliminar</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}