"use client";

import { Stack, Text, Title } from "@mantine/core";
import { IconClock, IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  businessId: string;
}

interface Props {
  slug: string;
  selectedService: Service | null;
  onNext: (service: Service) => void;
  primaryColor?: string;
}

const serviceEmojis = ["💼", "🎨", "💻", "📱", "🚀", "⭐", "🔧", "📋"];

export function ServiceStep({ slug, selectedService, onNext, primaryColor = "#2563eb" }: Props) {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/business/${slug}/services`)
      .then((res) => res.json())
      .then(setServices);
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
        .service-price {
          margin-left: auto;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .services-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .service-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 18px 16px;
            min-height: 160px;
          }
          .service-price {
            margin-left: 0;
            margin-top: auto;
          }
        }
      `}</style>

      <div>
        <Title order={4}>¿Qué servicio necesitas?</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Selecciona uno de los servicios disponibles
        </Text>
      </div>

      <div className="services-grid">
        {services.map((service, i) => {
          const isSelected = selectedService?.id === service.id;
          return (
            <div
              key={service.id}
              onClick={() => onNext(service)}
              className="service-card"
              style={{
                background: "white",
                borderRadius: 16,
                cursor: "pointer",
                border: `2px solid ${isSelected ? primaryColor : "transparent"}`,
                boxShadow: isSelected
                  ? `0 0 0 4px ${primaryColor}22`
                  : "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.15s ease",
                position: "relative",
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  width: 22, height: 22, borderRadius: "50%",
                  background: primaryColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <IconCheck size={12} color="white" strokeWidth={3} />
                </div>
              )}

              {/* Ícono */}
              <div style={{
                width: 48, height: 48, minWidth: 48, borderRadius: 14,
                background: isSelected ? `${primaryColor}18` : "#f8fafc",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {serviceEmojis[i % serviceEmojis.length]}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700} size="md" style={{
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {service.name}
                </Text>
                <Text size="xs" c="dimmed" mt={3} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <IconClock size={12} />
                  {service.duration} min
                </Text>
              </div>

              {/* Precio */}
              <Text fw={700} size="lg" className="service-price" style={{ color: primaryColor }}>
                ${(service.price / 100).toFixed(2)}
              </Text>
            </div>
          );
        })}
      </div>
    </Stack>
  );
}