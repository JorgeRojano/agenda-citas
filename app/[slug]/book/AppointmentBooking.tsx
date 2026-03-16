"use client";

import { useState } from "react";
import { Button, Modal } from "@mantine/core";
import { useParams } from "next/navigation";
import { DateValue } from "@mantine/dates";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconWorld,
} from "@tabler/icons-react";
import { DateStep } from "./DateStep";
import { TimeStep } from "./TimeStep";
import { ServiceStep } from "./ServiceStep";
import { DetailsStep } from "./DetailsStep";
import { createAppointment } from "./actions";
import { BookingPending } from "./BookingPending";

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

const darkenColor = (hex: string, amount = 40): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

const stepLabels = ["Servicio", "Fecha", "Hora", "Tus datos"];

// ── LEFT PANEL — fuera del componente principal ──
interface LeftPanelProps {
  business: Business;
  primaryColor: string;
  darkColor: string;
  compact: boolean;
  selectedService: Service | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  active?: number;
}

function LeftPanel({
  business,
  primaryColor,
  darkColor,
  compact,
  selectedService,
  selectedDate,
  selectedTime,
  active = 0,
}: LeftPanelProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(160deg, ${primaryColor}, ${darkColor})`,
        display: "flex",
        flexDirection: compact ? "row" : "column",
        alignItems: "center",
        justifyContent: compact ? "center" : "center",
        gap: compact ? 14 : 16,
        padding: compact ? "16px 20px" : "40px 32px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: compact ? 44 : 88,
          height: compact ? 44 : 88,
          minWidth: compact ? 44 : 88,
          borderRadius: compact ? 12 : 24,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? 20 : 40,
          zIndex: 1,
          boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt="logo"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span>🏢</span>
        )}
      </div>

      {/* Nombre y descripción */}
      <div
        style={{
          zIndex: 1,
          minWidth: 0,
          textAlign: compact ? "left" : "center",
        }}
      >
        <div
          style={{
            fontSize: compact ? 16 : 24,
            fontWeight: 700,
            color: "white",
            fontFamily: "Georgia, serif",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: compact ? "nowrap" : "normal",
          }}
        >
          {business.name}
        </div>
        {!compact && business.description && (
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            {business.description}
          </div>
        )}
      </div>

      {/* Resumen de selecciones — solo desktop */}
      {!compact && active > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 14,
            padding: "14px 16px",
            width: "100%",
            zIndex: 1,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Tu selección
          </div>

          {/* Servicio */}
          {selectedService && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                💼
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 600,
                  }}
                >
                  Servicio
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "white",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedService.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  {selectedService.duration} min · $
                  {(selectedService.price / 100).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Fecha */}
          {selectedDate && active >= 2 && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  📅
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.45)",
                      fontWeight: 600,
                    }}
                  >
                    Fecha
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "white" }}
                  >
                    {new Date(selectedDate).toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Hora */}
          {selectedTime && active >= 3 && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  🕐
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.45)",
                      fontWeight: 600,
                    }}
                  >
                    Hora
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "white" }}
                  >
                    {new Date(selectedTime).toLocaleTimeString("es-MX", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "America/Mexico_City",
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Redes sociales — solo desktop */}
      {!compact &&
        (business.facebook || business.instagram || business.website) && (
          <div style={{ display: "flex", gap: 8, zIndex: 1 }}>
            {business.facebook && (
              <a
                href={business.facebook}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconBrandFacebook size={18} color="white" />
                </div>
              </a>
            )}
            {business.instagram && (
              <a
                href={business.instagram}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconBrandInstagram size={18} color="white" />
                </div>
              </a>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWorld size={18} color="white" />
                </div>
              </a>
            )}
          </div>
        )}

      {!compact && (
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 11,
            fontWeight: 600,
            padding: "5px 14px",
            borderRadius: 99,
            zIndex: 1,
          }}
        >
          Agenda tu cita
        </div>
      )}
    </div>
  );
}

// ── STEPS HEADER — fuera del componente principal ──
interface StepsHeaderProps {
  active: number;
  primaryColor: string;
}

function StepsHeader({ active, primaryColor }: StepsHeaderProps) {
  return (
    <div
      style={{
        background: "white",
        borderBottom: "1px solid #f1f5f9",
        padding: "16px 24px",
        display: "flex",
        flexShrink: 0,
      }}
    >
      {stepLabels.map((label, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            position: "relative",
          }}
        >
          {i < stepLabels.length - 1 && (
            <div
              style={{
                position: "absolute",
                top: 16,
                left: "50%",
                width: "100%",
                height: 2,
                background: i < active ? "#bbf7d0" : "#f1f5f9",
                zIndex: 0,
              }}
            />
          )}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              zIndex: 1,
              background:
                i < active
                  ? "#dcfce7"
                  : i === active
                    ? primaryColor
                    : "#f1f5f9",
              color:
                i < active ? "#16a34a" : i === active ? "white" : "#94a3b8",
              boxShadow: i === active ? `0 0 0 4px ${primaryColor}22` : "none",
            }}
          >
            {i < active ? "✓" : i + 1}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color:
                i === active
                  ? primaryColor
                  : i < active
                    ? "#16a34a"
                    : "#94a3b8",
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function AppointmentBooking({ business }: Props) {
  const params = useParams();
  const slug = params.slug as string;

  const [active, setActive] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const totalSteps = 4;

  const primaryColor = business.primaryColor ?? "#2563eb";
  const darkColor = darkenColor(primaryColor, 40);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setActive(1);
  };
  const handleDateSelect = (date: DateValue) => {
    setSelectedDate(date);
    setActive(2);
  };
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setActive(3);
  };

  const handleSubmit = async (details: any) => {
    if (!selectedTime || !selectedService?.id) return;
    setSubmitting(true);
    try {
      await createAppointment(
        slug,
        selectedTime,
        selectedService.id,
        details.name,
        details.phone,
      );
      setPendingModalOpen(true);
    } catch (error) {
      console.error("Error al crear la cita:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setPendingModalOpen(false);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setActive(0);
  };

  return (
    <>
      <style>{`
        .booking-wrap {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }
        .booking-left-desktop {
          display: none;
        }
        .booking-left-mobile {
          display: block;
          flex-shrink: 0;
        }
        .booking-right {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .booking-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .booking-footer {
          background: white;
          border-top: 1px solid #f1f5f9;
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .booking-wrap {
            flex-direction: row;
            height: 100dvh;
            overflow: hidden;
          }
          .booking-left-desktop {
            display: block;
            width: 320px;
            min-width: 320px;
            flex-shrink: 0;
            height: 100%;
          }
          .booking-left-mobile {
            display: none;
          }
          .booking-right {
            flex: 1;
            min-width: 0;
          }
          .booking-content {
            padding: 32px 40px;
          }
          .booking-footer {
            padding: 16px 40px;
          }
        }
      `}</style>

      <div className="booking-wrap">
        {/* Desktop left */}
        <div className="booking-left-desktop">
          <LeftPanel
            business={business}
            primaryColor={primaryColor}
            darkColor={darkColor}
            compact={false}
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            active={active}
          />
        </div>

        {/* Right */}
        <div className="booking-right">
          {/* Mobile header */}
          <div className="booking-left-mobile">
            <LeftPanel
              business={business}
              primaryColor={primaryColor}
              darkColor={darkColor}
              compact={active > 0}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              active={active}
            />
          </div>

          <StepsHeader active={active} primaryColor={primaryColor} />

          <div className="booking-content">
            {active === 0 && (
              <ServiceStep
                slug={slug}
                primaryColor={primaryColor}
                selectedService={selectedService}
                onNext={handleServiceSelect}
              />
            )}
            {active === 1 && (
              <DateStep
                primaryColor={primaryColor}
                selectedService={selectedService}
                selectedDate={selectedDate}
                onNext={handleDateSelect}
              />
            )}
            {active === 2 && (
              <TimeStep
                slug={slug}
                primaryColor={primaryColor}
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onNext={handleTimeSelect}
              />
            )}
            {active === 3 && (
              <DetailsStep
                primaryColor={primaryColor}
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSubmit={handleSubmit}
              />
            )}
          </div>

          <div className="booking-footer">
            {active > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActive(active - 1)}
              >
                ← Regresar
              </Button>
            ) : (
              <div />
            )}
            {active === totalSteps - 1 && (
              <Button
                type="submit"
                form="details-form"
                size="sm"
                loading={submitting}
                style={{ background: primaryColor }}
              >
                Solicitar cita
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        opened={pendingModalOpen}
        onClose={() => {}}
        centered
        withCloseButton={false}
        radius="lg"
        size="sm"
      >
        <BookingPending
          serviceName={selectedService?.name || ""}
          time={selectedTime}
          onBookAnother={handleBookAnother}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedService={selectedService}
          primaryColor={primaryColor}
        />
      </Modal>
    </>
  );
}
