"use client";

import { Service } from "@/types/Service";
import { Stack, Text, Title, Center, Loader } from "@mantine/core";
import { IconClock, IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface Props {
  slug: string;
  selectedService: Service | null;
  onNext: (service: Service) => void;
  colorName?: string;
}

const serviceEmojis = ["💼", "🎨", "💻", "📱", "🚀", "⭐", "🔧", "📋"];

export function ServiceStep({
  slug,
  selectedService,
  onNext,
  colorName = "blue",
}: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/business/${slug}/services`)
      .then((res) => res.json())
      .then(setServices)
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <Stack gap="md">
      <style>{`
        .services-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .service-card {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
        }
        .service-card:hover {
          background: var(--mantine-color-default-hover) !important;
          transform: translateY(-1px);
        }
        .service-price {
          margin-left: auto;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .services-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .service-card { flex-direction: column; align-items: flex-start; gap: 12px; padding: 18px 16px; min-height: 160px; }
          .service-price { margin-left: 0; margin-top: auto; }
        }
      `}</style>

      <div>
        <Title order={4}>¿Qué servicio necesitas?</Title>
        <Text size="sm" c="dimmed" mt={4}>Selecciona uno de los servicios disponibles</Text>
      </div>

      {loading ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Cargando servicios...</Text>
          </Stack>
        </Center>
      ) : (
        <div className="services-grid">
          {services.map((service, i) => {
            const isSelected = selectedService?.id === service.id;
            return (
              <div
                key={service.id}
                onClick={() => onNext(service)}
                className="service-card"
                style={{
                  background: isSelected
                    ? `var(--mantine-color-${colorName}-light)`      // era ${primaryColor}12
                    : "var(--mantine-color-default)",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: isSelected
                    ? `2px solid var(--mantine-color-${colorName}-3)` // era primaryColor hex
                    : "2px solid transparent",
                  boxShadow: isSelected
                    ? `0 0 0 4px var(--mantine-color-${colorName}-light)` // era ${primaryColor}22
                    : "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 22, height: 22, borderRadius: "50%",
                    background: `var(--mantine-color-${colorName}-6)`, // era primaryColor hex
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <IconCheck size={12} color="white" strokeWidth={3} />
                  </div>
                )}

                <div style={{
                  width: 48, height: 48, minWidth: 48, borderRadius: 14,
                  background: isSelected
                    ? `var(--mantine-color-${colorName}-light-hover)` // era ${primaryColor}18
                    : "var(--mantine-color-default-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>
                  {serviceEmojis[i % serviceEmojis.length]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700} size="md" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {service.name}
                  </Text>
                  <Text size="xs" c="dimmed" mt={3} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <IconClock size={12} />
                    {service.duration} min
                  </Text>
                </div>

                {service.showPrice && (
                  <Text fw={700} size="lg" className="service-price"
                    style={{ color: isSelected ? `var(--mantine-color-${colorName}-7)` : "var(--mantine-color-text)" }}
                  >
                    ${(service.price / 100).toFixed(2)}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Stack>
  );
}