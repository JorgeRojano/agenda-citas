import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { formatDateTimeMexico } from "@/lib/utils";
import { Card, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";

export function DetailsStep({
  selectedService,
  selectedDate,
  selectedTime,
  onSubmit,
}: any) {
  const [phone, setPhone] = useState<string>("+52");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // format the raw UTC slot into Mexico timezone and human-readable string
  const displayDateTime = formatDateTimeMexico(selectedTime);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 4
          ? "Nombre debe tener al menos 4 caracteres"
          : null,
      //email: (value) => (/^\S+@\S+$/.test(value) ? null : "Correo inválido"),
    },
  });

  const handleSubmit = (values: any) => {
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número de teléfono inválido");
      return;
    }
    setPhoneError(null);
    onSubmit({ ...values, phone });
  };

  return (
    <Stack gap="xs" mb="lg">
      <Stack gap="xs" mb="lg">
        <Title order={4}>Tu Información</Title>

        <Text size="sm" c="dimmed">
          {selectedService?.name} · {displayDateTime}
        </Text>
      </Stack>

      <form id="details-form" onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md" mt="sm">
          <TextInput
            required
            label="Nombre"
            placeholder="Tu nombre completo"
            {...form.getInputProps("name")}
          />

          <div>
            <Text size="sm" fw={500} mb={4}>
              Celular <span style={{ color: "red" }}>*</span>
            </Text>
            <PhoneInput
              defaultCountry="MX"
              international
              withCountryCallingCode
              value={phone}
              onChange={(value) => {
                setPhone(value ?? "");
                setPhoneError(null);
              }}
              style={{
                border: "1px solid #ced4da",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            />
            {phoneError && (
              <Text size="xs" c="red" mt={4}>
                {phoneError}
              </Text>
            )}
          </div>

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
