import {
  Card,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import classes from "./ServiceStep.module.css"; // Ver abajo para el CSS
import { useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  businessId: string;
}

export function ServiceStep({ slug, selectedService, onNext }: any) {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/business/${slug}/services`)
      .then((res) => res.json())
      .then(setServices);
  }, [slug]);

  return (
    <Stack gap="xs" mb="lg">
      <Title order={4} mb="lg">
        Selecciona un servicio
      </Title>

      <ScrollArea offsetScrollbars scrollbarSize={6}>
        <Stack gap="sm" p="sm">
          {services.map((service) => (
            <UnstyledButton
              key={service.id}
              onClick={() => onNext(service)}
              className={classes.serviceItem}
              data-selected={selectedService === service || undefined}
            >
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={600} size="md">
                    {service.name}
                  </Text>
                  <Group gap={5} mt={4}>
                    <IconClock size={14} style={{ opacity: 0.6 }} />
                    <Text size="xs" c="dimmed">
                      {service.duration} min
                    </Text>
                  </Group>
                </div>
                <Text fw={700} size="lg">
                  ${service.price.toFixed(2)}
                </Text>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      </ScrollArea>
      {/* {SERVICES.length > 4 && (
        <Text size="xs" c="dimmed" ta="center" mt="sm">
          Desliza para ver más servicios
        </Text>
      )} */}
    </Stack>
  );
}
