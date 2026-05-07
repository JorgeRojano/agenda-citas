import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const TZ = "America/Mexico_City";

// ─── helpers ────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));

const fmtGeneratedAt = () => {
  const d = new Date();
  const date = new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ, month: "short", day: "numeric", year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);
  return `Generado ${date} · ${time}`;
};

const fmtDayLabel = (dateKey: string) => {
  const [y, m, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC", weekday: "long", month: "long", day: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, day, 12))).toUpperCase();
};

const fmtPrice = (cents: number) => {
  const n = Math.round(cents) / 100;
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0 });
};

// ─── design tokens ──────────────────────────────────────────────────────────

const c = {
  text:   "#111827",
  sub:    "#6b7280",
  border: "#e5e7eb",
  bg:     "#f3f4f6",
  rowSep: "#f3f4f6",
  PENDING:   { bg: "#fff7ed", fg: "#c2410c" },
  CONFIRMED: { bg: "#f0fdf4", fg: "#15803d" },
  CANCELLED: { bg: "#fef2f2", fg: "#b91c1c" },
  COMPLETED: { bg: "#eff6ff", fg: "#1d4ed8" },
};

// ─── styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: { padding: "40 48 56 48", fontSize: 10, fontFamily: "Helvetica", color: c.text },

  // header
  header:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  bizName:     { fontSize: 22, fontFamily: "Helvetica-Bold" },
  bizSub:      { fontSize: 9, color: c.sub, marginTop: 3 },
  rptLabel:    { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right", marginBottom: 4 },
  rptMeta:     { fontSize: 9, color: c.sub, textAlign: "right", lineHeight: 1.6 },

  divider: { borderBottom: "1pt solid #d1d5db", marginBottom: 14 },

  // filter band
  filterBand:  { flexDirection: "row", backgroundColor: c.bg, borderRadius: 6, padding: "10 16", marginBottom: 16 },
  filterCell:  { flex: 1 },
  filterLbl:   { fontSize: 7, fontFamily: "Helvetica-Bold", color: c.sub, textTransform: "uppercase", marginBottom: 3 },
  filterVal:   { fontSize: 11, fontFamily: "Helvetica-Bold" },

  // stats row
  statsRow:    { flexDirection: "row", gap: 10, marginBottom: 20 },
  statBox:     { flex: 1, border: "1pt solid #e5e7eb", borderRadius: 6, padding: "12 16" },
  statNum:     { fontSize: 24, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  statLbl:     { fontSize: 7, fontFamily: "Helvetica-Bold", color: c.sub, textTransform: "uppercase" },

  // day group
  dayRow:      { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 6 },
  dayLbl:      { fontSize: 7, fontFamily: "Helvetica-Bold", color: c.sub, marginRight: 8, flexShrink: 0 },
  dayLine:     { flex: 1, borderBottom: "0.5pt solid #d1d5db" },

  // appointment row
  apptRow:     { flexDirection: "row", paddingVertical: 8, borderBottom: "0.5pt solid #f3f4f6", alignItems: "flex-start" },
  apptTime:    { width: 52, fontSize: 9, color: c.sub, paddingTop: 1, flexShrink: 0 },
  apptMain:    { flex: 1 },
  apptName:    { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  apptSub:     { fontSize: 8, color: c.sub },
  apptRight:   { alignItems: "flex-end", flexShrink: 0, paddingLeft: 12 },
  apptPrice:   { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  badge:       { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:   { fontSize: 7, fontFamily: "Helvetica-Bold" },

  // footer
  footer:      { position: "absolute", bottom: 24, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
  footerText:  { fontSize: 8, color: c.sub },
});

const statusLabel: Record<string, string> = {
  PENDING:   "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

// ─── types ───────────────────────────────────────────────────────────────────

export interface ReportAppointment {
  id: string;
  clientName: string;
  startTime: string;
  status: string;
  service: { name: string; price: number; duration: number };
  assignedTo: { name: string } | null;
}

interface Props {
  businessName: string;
  from: string;
  to: string;
  serviceName: string;
  staffName: string;
  appointments: ReportAppointment[];
}

// ─── component ───────────────────────────────────────────────────────────────

export function AppointmentsReportPDF({ businessName, from, to, serviceName, staffName, appointments }: Props) {
  const total   = appointments.length;
  const revenue = appointments.reduce((sum, a) => sum + a.service.price, 0);
  const avg     = total > 0 ? Math.round(revenue / total) : 0;

  // group by calendar day in Mexico City TZ
  const grouped = appointments.reduce<Record<string, ReportAppointment[]>>((acc, a) => {
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(a.startTime));
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});
  const days = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Encabezado ─────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.bizName}>{businessName}</Text>
            <Text style={s.bizSub}>sistema de gestión de citas</Text>
          </View>
          <View>
            <Text style={s.rptLabel}>REPORTE DE CITAS</Text>
            <Text style={s.rptMeta}>{fmtGeneratedAt()}{"\n"}Preparado por Admin</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Banda de filtros ────────────────────────────────────── */}
        <View style={s.filterBand}>
          <View style={s.filterCell}>
            <Text style={s.filterLbl}>Período</Text>
            <Text style={s.filterVal}>{from} – {to}</Text>
          </View>
          <View style={s.filterCell}>
            <Text style={s.filterLbl}>Filtro de personal</Text>
            <Text style={s.filterVal}>{staffName}</Text>
          </View>
          <View style={s.filterCell}>
            <Text style={s.filterLbl}>Filtro de servicio</Text>
            <Text style={s.filterVal}>{serviceName}</Text>
          </View>
        </View>

        {/* ── Estadísticas ────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{total}</Text>
            <Text style={s.statLbl}>Citas</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{fmtPrice(revenue)}</Text>
            <Text style={s.statLbl}>Ingresos totales</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{fmtPrice(avg)}</Text>
            <Text style={s.statLbl}>Prom. por cita</Text>
          </View>
        </View>

        {/* ── Citas por día ───────────────────────────────────────── */}
        {days.map(([dateKey, appts]) => (
          <View key={dateKey}>
            <View style={s.dayRow}>
              <Text style={s.dayLbl}>{fmtDayLabel(dateKey)}</Text>
              <View style={s.dayLine} />
            </View>

            {appts.map((a) => {
              const badge = c[a.status as keyof typeof c] as { bg: string; fg: string } | undefined;
              return (
                <View key={a.id} style={s.apptRow} wrap={false}>
                  <Text style={s.apptTime}>{fmtTime(a.startTime)}</Text>
                  <View style={s.apptMain}>
                    <Text style={s.apptName}>{a.clientName}</Text>
                    <Text style={s.apptSub}>
                      {a.service.name}
                      {a.assignedTo ? ` · ${a.assignedTo.name}` : ""}
                      {` · ${a.service.duration} min`}
                    </Text>
                  </View>
                  <View style={s.apptRight}>
                    <Text style={s.apptPrice}>{fmtPrice(a.service.price)}</Text>
                    {badge && (
                      <View style={[s.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[s.badgeText, { color: badge.fg }]}>
                          {statusLabel[a.status] ?? a.status}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* ── Pie de página (se repite en cada página) ───────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{businessName} — Reporte de citas</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
}
