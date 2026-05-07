"use client";

import { Alert, Button, Group, Paper, Select, Stack, Text, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import { IconAlertCircle, IconCircleCheck, IconDownload, IconEye, IconRefresh } from "@tabler/icons-react";

interface Service      { id: string; name: string; }
interface StaffMember  { id: string; name: string; specialty: string | null; }

// ─── design tokens ────────────────────────────────────────────────────────────
const SECTION_BG     = "#f0ede6";
const SECTION_BORDER = "#e0dbd1";

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseUTCDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function fmtMonDay(d: Date) {
  return d.toLocaleDateString("es-MX", { timeZone: "UTC", month: "short", day: "numeric" });
}
function formatPeriod(from: string | null, to: string | null): string | null {
  if (!from && !to) return null;
  if (from && to) {
    const f = parseUTCDate(from);
    const t = parseUTCDate(to);
    const sameYear  = f.getUTCFullYear() === t.getUTCFullYear();
    const sameMonth = sameYear && f.getUTCMonth() === t.getUTCMonth();
    if (sameMonth) return `${fmtMonDay(f)} – ${t.getUTCDate()}, ${t.getUTCFullYear()}`;
    if (sameYear)  return `${fmtMonDay(f)} – ${fmtMonDay(t)}, ${t.getUTCFullYear()}`;
    return `${fmtMonDay(f)}, ${f.getUTCFullYear()} – ${fmtMonDay(t)}, ${t.getUTCFullYear()}`;
  }
  if (from) { const f = parseUTCDate(from); return `Desde ${fmtMonDay(f)}, ${f.getUTCFullYear()}`; }
  const t = parseUTCDate(to!);
  return `Hasta ${fmtMonDay(t)}, ${t.getUTCFullYear()}`;
}
function formatPeriodShort(from: string | null, to: string | null): string | null {
  if (!from && !to) return null;
  if (from && to)   return `${fmtMonDay(parseUTCDate(from))} – ${fmtMonDay(parseUTCDate(to))}`;
  if (from)         return `Desde ${fmtMonDay(parseUTCDate(from))}`;
  return `Hasta ${fmtMonDay(parseUTCDate(to!))}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, first = false }: { label: string; first?: boolean }) {
  return (
    <div style={{
      background: SECTION_BG, padding: "6px 16px",
      borderTop:    first ? undefined : `1px solid ${SECTION_BORDER}`,
      borderBottom: `1px solid ${SECTION_BORDER}`,
    }}>
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.07em" }}>{label}</Text>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "var(--mantine-color-blue-light)",
      color: "var(--mantine-color-blue-light-color)",
      borderRadius: 99, padding: "3px 8px 3px 10px",
      fontSize: 12, fontWeight: 500,
    }}>
      {label}
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer", padding: 0,
        lineHeight: 1, display: "flex", alignItems: "center", color: "inherit",
        fontSize: 14, opacity: 0.75,
      }}>×</button>
    </div>
  );
}

// ─── PDF format preview ───────────────────────────────────────────────────────

const SAMPLE_ROWS = [
  { time: "9:00 a.m.",  sub: "Consulta · Dr. Ramírez · 45 min",     price: "$120", status: "Pagado",    statusBg: "#f0fdf4", statusFg: "#15803d" },
  { time: "11:30 a.m.", sub: "Seguimiento · Dr. Torres · 30 min",   price: "$80",  status: "Pendiente", statusBg: "#fff7ed", statusFg: "#c2410c" },
  { time: "3:00 p.m.",  sub: "Procedimiento · Dr. Vega · 90 min",   price: "$340", status: "Cancelado", statusBg: "#fef2f2", statusFg: "#b91c1c" },
];

function PdfFormatPreview({ from, to, staffName, statusName }: {
  from: string | null; to: string | null;
  staffName: string; statusName: string;
}) {
  const period = formatPeriod(from, to) ?? "Todas las fechas";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>

      {/* Preview header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px",
        background: "#f8f9fa",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "#fff", border: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <IconEye size={16} color="#6b7280" />
        </div>
        <div>
          <Text fw={700} size="sm">Vista previa del diseño</Text>
          <Text size="xs" c="dimmed">Estructura de muestra — tus datos reales aparecerán en el PDF descargado</Text>
        </div>
      </div>

      {/* PDF content mockup */}
      <div style={{
        background: "#fff", padding: "20px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif", color: "#111827", fontSize: 12,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Nombre del negocio</div>
            <div style={{ fontSize: 8, color: "#9ca3af" }}>sistema de gestión de citas</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 3 }}>REPORTE DE CITAS</div>
            <div style={{ fontSize: 7.5, color: "#9ca3af", lineHeight: 1.6 }}>
              Generado 6 may. 2026 · 9:14 a.m.<br />Preparado por Admin
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #d1d5db", marginBottom: 10 }} />

        {/* Filter band */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
          {[
            { label: "Período",           value: period     },
            { label: "Filtro de personal", value: staffName  },
            { label: "Filtro de estado",   value: statusName },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["12", "Citas"], ["$1,480", "Ingresos totales"], ["$123", "Prom. por cita"]].map(([num, lbl]) => (
            <div key={lbl} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{num}</div>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Day label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: "#9ca3af", flexShrink: 0 }}>LUNES, 5 DE MAYO</div>
          <div style={{ flex: 1, borderTop: "0.5px solid #d1d5db" }} />
        </div>

        {/* Sample rows */}
        {SAMPLE_ROWS.map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0", borderBottom: "0.5px solid #f3f4f6" }}>
            <div style={{ width: 48, fontSize: 8, color: "#9ca3af", flexShrink: 0, paddingTop: 1 }}>{row.time}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2 }}>Nombre del cliente</div>
              <div style={{ fontSize: 8, color: "#9ca3af" }}>{row.sub}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700 }}>{row.price}</div>
              <div style={{ background: row.statusBg, color: row.statusFg, borderRadius: 4, padding: "2px 6px", fontSize: 7, fontWeight: 700 }}>
                {row.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

interface Props { slug: string; }

export default function ReportsClient({ slug }: Props) {
  const today     = new Date();
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const [from, setFrom] = useState<string | null>(
    toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
  );
  const [to, setTo] = useState<string | null>(toISODate(today));

  const [services, setServices]               = useState<Service[]>([]);
  const [serviceId, setServiceId]             = useState<string | null>("all");
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError]     = useState<string | null>(null);

  const [staff, setStaff]               = useState<StaffMember[]>([]);
  const [staffId, setStaffId]           = useState<string | null>("all");
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffError, setStaffError]     = useState<string | null>(null);

  const [status, setStatus] = useState<string | null>("all");

  const statusOptions = [
    { value: "all",       label: "Todos los estados" },
    { value: "PENDING",   label: "Pendiente"  },
    { value: "CONFIRMED", label: "Confirmado" },
    { value: "CANCELLED", label: "Cancelado"  },
    { value: "COMPLETED", label: "Completado" },
  ];

  useEffect(() => {
    setLoadingServices(true); setServicesError(null);
    fetch(`/api/business/${slug}/services`)
      .then((r) => { if (!r.ok) throw new Error("Error al cargar servicios"); return r.json(); })
      .then((d: Service[]) => setServices(d))
      .catch((e: Error) => setServicesError(e.message))
      .finally(() => setLoadingServices(false));
  }, [slug]);

  useEffect(() => {
    setLoadingStaff(true); setStaffError(null);
    fetch(`/api/business/${slug}/staff`)
      .then((r) => { if (!r.ok) throw new Error("Error al cargar personal"); return r.json(); })
      .then((d: StaffMember[]) => setStaff(d))
      .catch((e: Error) => setStaffError(e.message))
      .finally(() => setLoadingStaff(false));
  }, [slug]);

  const serviceOptions = [
    { value: "all", label: "Todos los servicios" },
    ...services.map((s) => ({ value: s.id, label: s.name })),
  ];
  const staffOptions = [
    { value: "all", label: "Todo el personal" },
    ...staff.map((m) => ({ value: m.id, label: m.specialty ? `${m.name} · ${m.specialty}` : m.name })),
  ];

  const resolvedServiceName = serviceId === "all" || !serviceId
    ? "Todos los servicios" : (services.find((s) => s.id === serviceId)?.name ?? "Todos los servicios");
  const resolvedStaffName = staffId === "all" || !staffId
    ? "Todos los proveedores" : (staff.find((m) => m.id === staffId)?.name ?? "Todos los proveedores");
  const resolvedStatusName = statusOptions.find((o) => o.value === status)?.label ?? "Todos los estados";

  const [generating, setGenerating]           = useState(false);
  const [generateError, setGenerateError]     = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  const handleReset = () => {
    setFrom(toISODate(new Date(today.getFullYear(), today.getMonth(), 1)));
    setTo(toISODate(today));
    setServiceId("all"); setStaffId("all"); setStatus("all");
    setGenerateSuccess(false); setGenerateError(null);
  };

  const handleGeneratePdf = async () => {
    setGenerating(true); setGenerateError(null); setGenerateSuccess(false);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to)   params.set("to",   to);
      if (serviceId && serviceId !== "all") params.set("serviceId", serviceId);
      if (staffId   && staffId   !== "all") params.set("staffId",   staffId);
      if (status    && status    !== "all") params.set("status",    status);

      const res = await fetch(`/api/business/${slug}/reports/pdf?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al generar el reporte");
      }

      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const month = from ? from.slice(0, 7) : toISODate(today).slice(0, 7);
      const a     = document.createElement("a");
      a.href = url; a.download = `reporte-citas-${month}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setGenerateSuccess(true);
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setGenerating(false);
    }
  };

  const periodLabel = formatPeriodShort(from, to);

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Reportes</Title>
        <Text size="sm" c="dimmed" mt={2}>Genera y descarga reportes de citas</Text>
      </div>

      {/* ── Alertas ─────────────────────────────────────────────── */}
      {generateSuccess && (
        <Alert
          icon={<IconCircleCheck size={16} />}
          color="green" radius="md" withCloseButton
          onClose={() => setGenerateSuccess(false)}
        >
          PDF generado exitosamente — la descarga ha comenzado.
        </Alert>
      )}
      {generateError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red" radius="md" withCloseButton
          onClose={() => setGenerateError(null)}
        >
          {generateError}
        </Alert>
      )}

      {/* ── Tarjeta de filtros ──────────────────────────────────── */}
      <Paper withBorder radius="md" style={{ overflow: "hidden", borderColor: SECTION_BORDER }}>

        <SectionHeader label="Rango de fechas" first />
        <div style={{ padding: "16px 16px 12px", background: "#fff" }}>
          <Group align="flex-end" gap="md">
            <DatePickerInput
              label="Desde" placeholder="Fecha de inicio"
              value={from} onChange={setFrom}
              valueFormat="DD/MM/YYYY"
              maxDate={to ? new Date(to) : undefined}
              clearable style={{ flex: 1 }}
            />
            <DatePickerInput
              label="Hasta" placeholder="Fecha fin"
              value={to} onChange={setTo}
              valueFormat="DD/MM/YYYY"
              minDate={from ? new Date(from) : undefined}
              maxDate={today}
              clearable style={{ flex: 1 }}
            />
            <div style={{ flex: 1, paddingBottom: 2 }}>
              <Text size="xs" c="dimmed" mb={4}>Período seleccionado</Text>
              <Text fw={600} size="sm">{formatPeriod(from, to) ?? "—"}</Text>
            </div>
          </Group>
        </div>

        <SectionHeader label="Filtros" />
        <div style={{ padding: "16px 16px 12px", background: "#fff" }}>
          <Group grow gap="md">
            <Select
              label="Tipo de servicio"
              placeholder={loadingServices ? "Cargando..." : "Todos los servicios"}
              data={serviceOptions} value={serviceId}
              onChange={(v) => setServiceId(v ?? "all")}
              disabled={loadingServices} error={servicesError ?? undefined}
            />
            <Select
              label="Personal / proveedor"
              placeholder={loadingStaff ? "Cargando..." : "Todo el personal"}
              data={staffOptions} value={staffId}
              onChange={(v) => setStaffId(v ?? "all")}
              disabled={loadingStaff} error={staffError ?? undefined}
            />
            <Select
              label="Estado"
              data={statusOptions} value={status}
              onChange={(v) => setStatus(v ?? "all")}
            />
          </Group>
        </div>

        <div style={{
          background: SECTION_BG, borderTop: `1px solid ${SECTION_BORDER}`,
          padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <Group gap="xs" wrap="wrap">
            <Text size="sm" c="dimmed">Filtros activos:</Text>
            {periodLabel && (
              <FilterPill label={periodLabel} onRemove={() => { setFrom(null); setTo(null); }} />
            )}
            {serviceId !== "all" && (
              <FilterPill label={resolvedServiceName} onRemove={() => setServiceId("all")} />
            )}
            {staffId !== "all" && (
              <FilterPill label={resolvedStaffName} onRemove={() => setStaffId("all")} />
            )}
            {status !== "all" && (
              <FilterPill label={resolvedStatusName} onRemove={() => setStatus("all")} />
            )}
          </Group>
          <Group gap="sm" style={{ flexShrink: 0 }}>
            <Button variant="default" leftSection={<IconRefresh size={15} />} onClick={handleReset}>
              Restablecer
            </Button>
            <Button
              leftSection={<IconDownload size={15} />}
              loading={generating} disabled={generating}
              onClick={handleGeneratePdf}
            >
              {generating ? "Generando…" : "Generar PDF"}
            </Button>
          </Group>
        </div>
      </Paper>

      {/* ── Vista previa del diseño ─────────────────────────────── */}
      <PdfFormatPreview
        from={from} to={to}
        staffName={resolvedStaffName}
        statusName={resolvedStatusName}
      />
    </Stack>
  );
}
