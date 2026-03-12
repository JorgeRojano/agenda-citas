"use client";

import { useState } from "react";
import { Stack, Text, Card, Group, Title, rem, Button } from "@mantine/core";
import { SegmentedProgress } from "./SegmentedProgress";
import { DateStep } from "./DateStep";
import { DateValue } from "@mantine/dates";
import { TimeStep } from "./TimeStep";
import { useParams } from "next/navigation";
import { ServiceStep } from "./ServiceStep";
import { DetailsStep } from "./DetailsStep";
import { createAppointment } from "./actions";
import { BookingPending } from "./BookingPending";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconWorld,
} from "@tabler/icons-react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}
interface Business {
  name: string;
  description: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  website: string | null;
}

interface Props {
  business: Business;
}

export default function AppointmentBooking({ business }: Props) {
  const params = useParams();
  const slug = params.slug as string;

  const [active, setActive] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const totalSteps = 4;

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setActive(1); // Avanza automáticamente al siguiente paso
  };

  const handleDateSelect = (date: DateValue) => {
    setSelectedDate(date);
    setActive(2); // Avanza automáticamente al siguiente paso
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setActive(3); // Avanza automáticamente al siguiente paso
  };

  const handleSubmit = async (details: any) => {
    if (!selectedTime || !selectedService?.id) {
      console.error("Tiempo o servicio no seleccionado");
      return;
    }

    try {
      await createAppointment(
        slug,
        selectedTime,
        selectedService.id,
        details.name,
        details.phone,
      );
      setBookingCompleted(true);
    } catch (error) {
      console.error("Error al crear la cita:", error);
    }
  };

  return (
    <div
      style={{
        height: "100dvh", // dynamic viewport height — funciona mejor en mobile
        display: "flex",
        flexDirection: "column",
        maxWidth: 500,
        margin: "0 auto",
        overflow: "hidden", // nada fuera del div hace scroll
      }}
    >
      {/* ── BANNER ── */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
        {/* Este div contiene y recorta el blob */}
        <div
          style={{
            height: "5vh",
            background: business.primaryColor ?? "#c8a882",
            position: "relative",
            overflow: "hidden", // 👈 vuelve a hidden para contener el blob
          }}
        >
          {/* Blob decorativo */}
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              background: business.primaryColor ?? "#c8a882",
              borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
              top: -80,
              right: -60,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Logo fuera del div con overflow:hidden */}
        <div
          style={{
            position: "absolute",
            bottom: -28,
            left: "50%",
            transform: "translateX(-50%)",
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            zIndex: 10,
          }}
        >
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt="logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 16,
              }}
            />
          ) : (
            <span>🏢</span>
          )}
        </div>
      </div>

      {/* ── BUSINESS INFO ── */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 0 }}>
        <div
          style={{
            background: "#faf7f2",
            padding: "36px 20px 16px", // el padding top da espacio al logo
            borderBottom: "1px solid #f0e8dc",
            marginBottom: 16,
            textAlign: "center", // 👈 centra el texto también
          }}
        >
          <Title
            order={3}
            style={{ fontSize: "1.25rem", fontFamily: "Georgia, serif", color: "#2d1f14" }}
          >
            {business.name}
          </Title>
          <Text size="sm" c="dimmed" mb="xs">
            {business.description}
          </Text>

          {/* Redes sociales */}
          {(business.instagram || business.facebook || business.website) && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 10,
              }}
            >
              {business.facebook && (
                <a href={business.facebook} target="_blank" rel="noreferrer">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#fce7f3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconBrandFacebook size={20} color="#e1306c" />
                  </div>
                </a>
              )}

              {business.instagram && (
                <a href={business.instagram} target="_blank" rel="noreferrer">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#fce7f3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconBrandInstagram size={20} color="#e1306c" />
                  </div>
                </a>
              )}

              {business.website && (
                <a href={business.website} target="_blank" rel="noreferrer">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconWorld size={20} color="#2563eb" />
                  </div>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "0 20px" }}>
        <SegmentedProgress active={active} totalSteps={totalSteps} />
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "0 20px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Card
          withBorder
          radius="md"
          padding="lg"
          shadow="sm"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {bookingCompleted ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookingPending
                serviceName={selectedService?.name || ""}
                time={selectedTime}
                onBookAnother={() => {
                  setBookingCompleted(false);
                  setSelectedService(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setActive(0);
                }}
              />
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {active === 0 && (
                  <ServiceStep
                    slug={slug}
                    selectedService={selectedService}
                    onNext={handleServiceSelect}
                  />
                )}

                {active === 1 && (
                  <DateStep
                    selectedService={selectedService}
                    selectedDate={selectedDate}
                    onNext={handleDateSelect}
                  />
                )}

                {active === 2 && (
                  <TimeStep
                    slug={slug}
                    selectedService={selectedService}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onNext={handleTimeSelect}
                  />
                )}

                {active === 3 && (
                  <DetailsStep
                    selectedService={selectedService}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>

              <Group justify="space-between" mt="md" style={{ flexShrink: 0 }}>
                {active > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActive(active - 1)}
                  >
                    Regresar
                  </Button>
                )}

                {/* placeholder for future confirm button when on last step */}
                {active === totalSteps - 1 && (
                  <Button type="submit" form="details-form" size="sm">
                    Confirmar reserva
                  </Button>
                )}
              </Group>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
