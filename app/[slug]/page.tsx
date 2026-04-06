import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  IconBrandWhatsapp, IconBrandInstagram,
  IconBrandFacebook, IconWorld, IconMapPin,
} from "@tabler/icons-react";

type Props = { params: Promise<{ slug: string }> };

const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatTime12(t: string): string {
  if (!t || !t.includes(":")) return t;
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

// Agrupa slots por rango de días consecutivos: [1,2,3,4,5] → "Lun – Vie"
function groupSchedule(slots: { dayOfWeek: number; startTime: string; endTime: string }[]) {
  const byDay: Record<number, { start: string; end: string }[]> = {};
  slots.forEach((s) => {
    if (!byDay[s.dayOfWeek]) byDay[s.dayOfWeek] = [];
    byDay[s.dayOfWeek].push({ start: s.startTime, end: s.endTime });
  });

  const rows: { label: string; hours: string }[] = [];
  const days = [0, 1, 2, 3, 4, 5, 6];

  days.forEach((dow) => {
    if (!byDay[dow]) return;
    const hours = byDay[dow].map((s) => `${formatTime12(s.start)} – ${formatTime12(s.end)}`).join(", ");
    const last  = rows[rows.length - 1];
    if (last && last.hours === hours) {
      // Extender rango — reemplazar label
      const parts  = last.label.split(" – ");
      last.label   = `${parts[0]} – ${weekDays[dow]}`;
    } else {
      rows.push({ label: weekDays[dow], hours });
    }
  });

  return rows;
}

export default async function BusinessLandingPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      timeSlots: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      images:    { orderBy: { order: "asc" } },
    },
  });
  if (!business) notFound();

  const colorName    = business.primaryColor ?? "blue";
  const schedule     = groupSchedule(business.timeSlots);
  const closedDays   = [0,1,2,3,4,5,6].filter((d) => !business.timeSlots.some((s) => s.dayOfWeek === d));
  const hasSocials   = business.whatsapp || business.instagram || business.facebook || business.website;

  return (
    <>
      <style>{`
        .landing-page { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; padding: 0; }
        .landing-card { width: 100%; max-width: 480px; background: var(--mantine-color-body); border-radius: 0; border: none; overflow: hidden; }
        .banner { width: 100%; height: 140px; position: relative; overflow: hidden; background: linear-gradient(135deg, var(--mantine-color-${colorName}-6), var(--mantine-color-${colorName}-8)); }
        .banner img { width: 100%; height: 100%; object-fit: cover; }
        .logo-wrap { display: flex; justify-content: center; margin-top: -28px; position: relative; z-index: 1; }
        .logo { width: 56px; height: 56px; border-radius: 16px; background: var(--mantine-color-body); border: 3px solid var(--mantine-color-body); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: var(--mantine-color-${colorName}-6); box-shadow: 0 2px 10px rgba(0,0,0,0.12); overflow: hidden; }
        .logo img { width: 100%; height: 100%; object-fit: cover; }
        .body { padding: 10px 20px 28px; }
        .biz-name { font-size: 20px; font-weight: 700; color: var(--mantine-color-text); text-align: center; margin-bottom: 3px; }
        .biz-desc { font-size: 13px; color: var(--mantine-color-dimmed); text-align: center; line-height: 1.65; margin-bottom: 16px; }
        .divider { height: 1px; background: var(--mantine-color-default-border); margin: 0 0 16px; }
        .section-label { font-size: 11px; font-weight: 700; color: var(--mantine-color-dimmed); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .schedule-box { background: var(--mantine-color-default-hover); border-radius: 10px; padding: 10px 12px; margin-bottom: 16px; }
        .schedule-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
        .schedule-closed { color: var(--mantine-color-red-6); font-weight: 500; }
        .social-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .social-btn { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: var(--mantine-color-default-hover); border-radius: 10px; border: 1px solid var(--mantine-color-default-border); text-decoration: none; color: var(--mantine-color-text); font-size: 13px; font-weight: 500; transition: background 0.15s; }
        .social-btn:hover { background: var(--mantine-color-default-border); }
        .carousel-wrap { margin-bottom: 16px; }
        .carousel { display: flex; gap: 0; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: 12px; }
        .carousel::-webkit-scrollbar { display: none; }
        .carousel-item { flex-shrink: 0; width: 100%; aspect-ratio: 16/9; scroll-snap-align: start; }
        .carousel-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .carousel-dots { display: flex; justify-content: center; gap: 5px; margin-top: 8px; }
        .dot { height: 6px; border-radius: 3px; background: var(--mantine-color-default-border); transition: all 0.2s; }
        .dot-active { background: var(--mantine-color-${colorName}-6); width: 16px; }
        .dot-inactive { width: 6px; }
        .location-box { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .location-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--mantine-color-default-hover); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .map-frame { border-radius: 12px; overflow: hidden; border: 1px solid var(--mantine-color-default-border); margin-bottom: 16px; height: 180px; }
        .map-frame iframe { width: 100%; height: 100%; border: none; display: block; }
        .cta { display: block; width: 100%; padding: 14px; border-radius: 12px; background: var(--mantine-color-${colorName}-6); color: white; font-size: 15px; font-weight: 700; text-align: center; text-decoration: none; border: none; cursor: pointer; transition: opacity 0.15s; }
        .cta:hover { opacity: 0.9; }
        .body-sidebar { display: none; }
        .cta-mobile { display: block; }
        @media (min-width: 768px) {
          .landing-page { padding: 0; align-items: stretch; }
          .landing-card { max-width: 100%; border-radius: 0; border: none; display: grid; grid-template-rows: auto 1fr; }
          .banner { height: 280px; }
          .logo-wrap { justify-content: flex-start; margin-top: -34px; padding-left: 48px; }
          .logo { width: 68px; height: 68px; font-size: 24px; }
          .body { padding: 12px 48px 48px; display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }
          .body-main { min-width: 0; }
          .body-sidebar { display: block; position: sticky; top: 24px; }
          .cta-mobile { display: none; }
          .biz-name { font-size: 26px; text-align: left; }
          .biz-desc { text-align: left; }
          .desktop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .desktop-grid .schedule-box { margin-bottom: 0; }
          .carousel-item { width: 100%; }
          .desktop-location-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
          .map-frame { margin-bottom: 0; height: 220px; }
          .desktop-divider-hidden { display: none; }
        }
      `}</style>

      <div className="landing-page">
        <div className="landing-card">

          {/* Banner */}
          <div className="banner">
            {business.bannerUrl && <img src={business.bannerUrl} alt="banner" />}
          </div>

          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo">
              {business.logoUrl
                ? <img src={business.logoUrl} alt="logo" />
                : business.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="body">
            <div className="body-main">
              <div className="biz-name">{business.name}</div>
              {business.description && (
                <div className="biz-desc">{business.description}</div>
              )}

              <div className="divider" />

              {/* Horario + Redes — grid en desktop */}
              {(schedule.length > 0 || hasSocials) && (
                <div className="desktop-grid">
                  {schedule.length > 0 && (
                    <div>
                      <div className="section-label">Horario</div>
                      <div className="schedule-box">
                        {schedule.map((row, i) => (
                          <div key={i} className="schedule-row">
                            <span style={{ color: "var(--mantine-color-dimmed)" }}>{row.label}</span>
                            <span style={{ fontWeight: 600, color: "var(--mantine-color-text)" }}>{row.hours}</span>
                          </div>
                        ))}
                        {closedDays.map((dow) => (
                          <div key={dow} className="schedule-row">
                            <span style={{ color: "var(--mantine-color-dimmed)" }}>{weekDays[dow]}</span>
                            <span className="schedule-closed">Cerrado</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasSocials && (
                    <div>
                      <div className="section-label">Redes sociales</div>
                      <div className="social-grid">
                        {business.whatsapp && (
                          <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="social-btn">
                            <IconBrandWhatsapp size={16} /> WhatsApp
                          </a>
                        )}
                        {business.instagram && (
                          <a href={business.instagram.startsWith("http") ? business.instagram : `https://instagram.com/${business.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="social-btn">
                            <IconBrandInstagram size={16} /> Instagram
                          </a>
                        )}
                        {business.facebook && (
                          <a href={business.facebook.startsWith("http") ? business.facebook : `https://facebook.com/${business.facebook}`} target="_blank" rel="noreferrer" className="social-btn">
                            <IconBrandFacebook size={16} /> Facebook
                          </a>
                        )}
                        {business.website && (
                          <a href={business.website} target="_blank" rel="noreferrer" className="social-btn">
                            <IconWorld size={16} /> Sitio web
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="divider" />

              {/* Galería */}
              {business.images.length > 0 && (
                <>
                  <div className="section-label">Galería</div>
                  <div className="carousel-wrap">
                    <div className="carousel" id="landing-carousel">
                      {business.images.map((img) => (
                        <div key={img.id} className="carousel-item">
                          <img src={img.url} alt="galería" />
                        </div>
                      ))}
                    </div>
                    {business.images.length > 1 && (
                      <div className="carousel-dots" id="landing-dots">
                        {business.images.map((_, i) => (
                          <div key={i} className={`dot ${i === 0 ? "dot-active" : "dot-inactive"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="divider" />
                </>
              )}

              {/* Ubicación */}
              {(business.address || business.mapsUrl) && (
                <>
                  <div className="section-label">Ubicación</div>
                  <div className="desktop-location-grid">
                    {business.address && (
                      <div className="location-box" style={{ marginBottom: 0 }}>
                        <div className="location-icon">
                          <IconMapPin size={16} color="var(--mantine-color-dimmed)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mantine-color-text)" }}>
                            {business.address}
                          </div>
                        </div>
                      </div>
                    )}
                    {business.mapsUrl && (
                      <div className="map-frame">
                        <iframe src={business.mapsUrl} allowFullScreen loading="lazy" />
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: 16 }} />
                </>
              )}

              {/* CTA — mobile only */}
              <Link href={`/${slug}/book`} className="cta cta-mobile">
                Agendar cita
              </Link>
            </div>

            {/* Sidebar — desktop only */}
            <div className="body-sidebar">
              <Link href={`/${slug}/book`} className="cta">
                Agendar cita
              </Link>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const c = document.getElementById('landing-carousel');
        const dots = document.querySelectorAll('#landing-dots .dot');
        if (c && dots.length) {
          c.addEventListener('scroll', () => {
            const i = Math.round(c.scrollLeft / c.offsetWidth);
            dots.forEach((d, j) => {
              d.style.width = i === j ? '16px' : '6px';
              d.style.background = i === j ? 'var(--mantine-color-${colorName}-6)' : 'var(--mantine-color-default-border)';
            });
          });

          let paused = false;
          c.addEventListener('pointerdown', () => { paused = true; });
          c.addEventListener('pointerup',   () => { setTimeout(() => { paused = false; }, 2000); });

          setInterval(() => {
            if (paused) return;
            const total = c.querySelectorAll('.carousel-item').length;
            const current = Math.round(c.scrollLeft / c.offsetWidth);
            const next = (current + 1) % total;
            c.scrollTo({ left: next * c.offsetWidth, behavior: 'smooth' });
          }, 5000);
        }
      `}} />
    </>
  );
}