"use client";

import { useState } from "react";
import { Button, Modal } from "@mantine/core";
import { useParams } from "next/navigation";
import { DateValue } from "@mantine/dates";
import { DateStep } from "./DateStep";
import { TimeStep } from "./TimeStep";
import { ServiceStep } from "./ServiceStep";
import { ResourceStep } from "./ResourceStep";
import { DetailsStep } from "./DetailsStep";
import { createAppointment } from "./actions";
import { BookingPending } from "./BookingPending";
import { Service } from "@/types/Service";
import { Business } from "@/types/Business";
import { Resource } from "@/types/Resource";

interface Props {
  business: Business;
}

// ── LEFT PANEL ──
interface LeftPanelProps {
  business: Business;
  colorName: string;
  compact: boolean;
  hasStaff: boolean;
  selectedService: Service | null;
  selectedResource: Resource | null;
  selectedDate: DateValue | null;
  selectedTime: string | null;
  active?: number;
}

function LeftPanel({
  business, colorName, compact, hasStaff,
  selectedService, selectedResource, selectedDate, selectedTime, active = 0,
}: LeftPanelProps) {
  // Con hasStaff=false el step de recurso no existe, así que los índices de fecha/hora
  // son uno menos — ajustamos el umbral de visibilidad en el resumen
  const dateThreshold = hasStaff ? 3 : 2;
  const timeThreshold = hasStaff ? 4 : 3;

  return (
    <div style={{
      width: "100%", height: "100%",
      background: `linear-gradient(160deg, var(--mantine-color-${colorName}-6), var(--mantine-color-${colorName}-8))`,
      display: "flex",
      flexDirection: compact ? "row" : "column",
      alignItems: "center", justifyContent: "center",
      gap: compact ? 14 : 16,
      padding: compact ? "16px 20px" : "40px 32px",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
    }}>
      {/* Logo */}
      <div style={{
        width: compact ? 44 : 88, height: compact ? 44 : 88, minWidth: compact ? 44 : 88,
        borderRadius: compact ? 12 : 24, background: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 20 : 40, zIndex: 1,
        boxShadow: "0 12px 32px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {business.logoUrl
          ? <img src={business.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span>🏢</span>}
      </div>

      {/* Nombre */}
      <div style={{ zIndex: 1, minWidth: 0, textAlign: compact ? "left" : "center" }}>
        <div style={{
          fontSize: compact ? 16 : 24, fontWeight: 700, color: "white",
          fontFamily: "Georgia, serif", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: compact ? "nowrap" : "normal",
        }}>
          {business.name}
        </div>
      </div>

      {/* Resumen — solo desktop */}
      {!compact && active > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 14, padding: "14px 16px", width: "100%",
          zIndex: 1, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tu selección
          </div>

          {selectedService && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💼</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Servicio</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedService.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{selectedService.duration} min · ${(selectedService.price / 100).toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Recurso — solo si hasStaff */}
          {hasStaff && selectedResource && active >= 2 && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Recurso</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{selectedResource.name}</div>
                  {selectedResource.specialty && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{selectedResource.specialty}</div>}
                </div>
              </div>
            </>
          )}

          {selectedDate && active >= dateThreshold && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📅</div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Fecha</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                    {new Date(selectedDate).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedTime && active >= timeThreshold && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🕐</div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Hora</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                    {new Date(selectedTime).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}


      {!compact && (
        <div style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600,
          padding: "5px 14px", borderRadius: 99, zIndex: 1,
        }}>
          Agenda tu cita
        </div>
      )}
    </div>
  );
}

// ── STEPS HEADER ──
interface StepsHeaderProps {
  active: number;
  colorName: string;
  stepLabels: string[];
}

function StepsHeader({ active, colorName, stepLabels }: StepsHeaderProps) {
  return (
    <div style={{
      background: "var(--mantine-color-body)",
      borderBottom: "1px solid var(--mantine-color-default-border)",
      padding: "16px 24px", display: "flex", flexShrink: 0,
    }}>
      {stepLabels.map((label, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative" }}>
          {i < stepLabels.length - 1 && (
            <div style={{
              position: "absolute", top: 16, left: "50%", width: "100%", height: 2,
              background: i < active ? "var(--mantine-color-green-light-hover)" : "var(--mantine-color-default-border)",
              zIndex: 0,
            }} />
          )}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, zIndex: 1,
            background: i < active
              ? "var(--mantine-color-green-light)"
              : i === active
                ? `var(--mantine-color-${colorName}-6)`
                : "var(--mantine-color-default-hover)",
            color: i < active
              ? "var(--mantine-color-green-light-color)"
              : i === active ? "white"
              : "var(--mantine-color-dimmed)",
            boxShadow: i === active ? `0 0 0 4px var(--mantine-color-${colorName}-light)` : "none",
          }}>
            {i < active ? "✓" : i + 1}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
            color: i === active
              ? `var(--mantine-color-${colorName}-6)`
              : i < active ? "var(--mantine-color-green-6)"
              : "var(--mantine-color-dimmed)",
          }}>
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
  const slug   = params.slug as string;

  const hasStaff = business.hasStaff ?? false;

  // stepLabels y totalSteps se derivan de hasStaff
  const stepLabels = hasStaff
    ? ["Servicio", "Recurso", "Fecha", "Hora", "Tus datos"]
    : ["Servicio", "Fecha", "Hora", "Tus datos"];
  const totalSteps = stepLabels.length;

  // Índices de cada step según hasStaff
  const STEPS = hasStaff
    ? { service: 0, resource: 1, date: 2, time: 3, details: 4 }
    : { service: 0, resource: -1, date: 1, time: 2, details: 3 };

  const [active, setActive]                     = useState(0);
  const [selectedService, setSelectedService]   = useState<Service | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate]         = useState<DateValue | null>(null);
  const [selectedTime, setSelectedTime]         = useState<string | null>(null);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [submitting, setSubmitting]             = useState(false);

  const colorName     = business.primaryColor ?? "blue";
  const primaryColor  = `var(--mantine-color-${colorName}-6)`;
  const LIGHT_COLORS  = ["yellow", "lime"];
  const textOnPrimary = LIGHT_COLORS.includes(colorName) ? `var(--mantine-color-black)` : `var(--mantine-color-white)`;

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedResource(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setActive(hasStaff ? STEPS.resource : STEPS.date);
  };

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource);
    setSelectedDate(null);
    setSelectedTime(null);
    setActive(STEPS.date);
  };

  const handleDateSelect = (date: DateValue) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setActive(STEPS.time);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setActive(STEPS.details);
  };

  const handleSubmit = async (details: any) => {
    if (!selectedTime || !selectedService?.id) return;
    setSubmitting(true);
    try {
      await createAppointment(slug, selectedTime, selectedService.id, details.name, details.phone, selectedResource?.id ?? null);
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
    setSelectedResource(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setActive(0);
  };

  return (
    <>
      <style>{`
        .booking-wrap { min-height: 100dvh; display: flex; flex-direction: column; background: var(--mantine-color-default-hover); }
        .booking-left-desktop { display: none; }
        .booking-left-mobile { display: block; flex-shrink: 0; }
        .booking-right { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        .booking-content { flex: 1; overflow-y: auto; padding: 24px; }
        .booking-footer { background: var(--mantine-color-body); border-top: 1px solid var(--mantine-color-default-border); padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        @media (min-width: 768px) {
          .booking-wrap { flex-direction: row; height: 100dvh; overflow: hidden; }
          .booking-left-desktop { display: block; width: 320px; min-width: 320px; flex-shrink: 0; height: 100%; }
          .booking-left-mobile { display: none; }
          .booking-right { flex: 1; min-width: 0; }
          .booking-content { padding: 32px 40px; }
          .booking-footer { padding: 16px 40px; }
        }
      `}</style>

      <div className="booking-wrap">
        <div className="booking-left-desktop">
          <LeftPanel business={business} colorName={colorName} compact={false} hasStaff={hasStaff} selectedService={selectedService} selectedResource={selectedResource} selectedDate={selectedDate} selectedTime={selectedTime} active={active} />
        </div>

        <div className="booking-right">
          <div className="booking-left-mobile">
            <LeftPanel business={business} colorName={colorName} compact={active > 0} hasStaff={hasStaff} selectedService={selectedService} selectedResource={selectedResource} selectedDate={selectedDate} selectedTime={selectedTime} active={active} />
          </div>

          <StepsHeader active={active} colorName={colorName} stepLabels={stepLabels} />

          <div className="booking-content">
            {active === STEPS.service && (
              <ServiceStep slug={slug} colorName={colorName} selectedService={selectedService} onNext={handleServiceSelect} />
            )}
            {hasStaff && active === STEPS.resource && (
              <ResourceStep slug={slug} colorName={colorName} selectedService={selectedService} selectedResource={selectedResource} onNext={handleResourceSelect} />
            )}
            {active === STEPS.date && (
              <DateStep slug={slug} colorName={colorName} selectedService={selectedService} selectedResource={selectedResource as Resource} selectedDate={selectedDate} onNext={handleDateSelect} />
            )}
            {active === STEPS.time && (
              <TimeStep slug={slug} colorName={colorName} selectedService={selectedService} selectedDate={selectedDate} selectedTime={selectedTime} staffId={selectedResource?.id ?? null} onNext={handleTimeSelect} />
            )}
            {active === STEPS.details && (
              <DetailsStep colorName={colorName} selectedService={selectedService} selectedResource={hasStaff ? selectedResource as Resource : null} selectedDate={selectedDate} selectedTime={selectedTime} onSubmit={handleSubmit} />
            )}
          </div>

          <div className="booking-footer">
            {active > 0
              ? <Button variant="outline" size="sm" onClick={() => setActive(active - 1)}>← Regresar</Button>
              : <div />}
            {active === totalSteps - 1 && (
              <Button
                type="submit" form="details-form" size="sm" loading={submitting}
                style={{ background: primaryColor, color: textOnPrimary }}
              >
                Solicitar cita
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal opened={pendingModalOpen} onClose={() => {}} centered withCloseButton={false} radius="lg" size="sm">
        <BookingPending
          serviceName={selectedService?.name || ""}
          time={selectedTime}
          onBookAnother={handleBookAnother}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedService={selectedService}
          colorName={colorName}
        />
      </Modal>
    </>
  );
}