import { formatDateTimeMexico } from "@/lib/utils";
import { Card, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";

export function DetailsStep({
  selectedService,
  selectedDate,
  selectedTime,
  onSubmit,
}: any) {
  // format the raw UTC slot into Mexico timezone and human-readable string
  const displayDateTime = formatDateTimeMexico(selectedTime);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      phone: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 4 ? "Nombre debe tener al menos 4 caracteres" : null,
      /* phone: (value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length === 10 ? null : "Número debe tener 10 dígitos";
      }, */
      //email: (value) => (/^\S+@\S+$/.test(value) ? null : "Correo inválido"),
    },
  });

  return (
    <Stack gap="xs" mb="lg">
      <Stack gap="xs" mb="lg">
        <Title order={4}>Tu Información</Title>

        <Text size="sm" c="dimmed">
          {selectedService?.name} · {displayDateTime}
        </Text>
      </Stack>

      <form
        id="details-form"
        onSubmit={form.onSubmit((values) => {
          onSubmit(values);
        })}
      >
        <Stack gap="md" mt="sm">
          <TextInput
            required
            label="Nombre"
            placeholder="Tu nombre completo"
            {...form.getInputProps("name")}
          />

          <TextInput
            required
            label="Celular"
            placeholder="(55) 1234-5678"
            {...form.getInputProps("phone")}
          />

          <TextInput
            label="Correo Electrónico"
            placeholder="tu.correo@ejemplo.com"
            {...form.getInputProps("email")}
          />
        </Stack>
      </form>
    </Stack>
  );
}
