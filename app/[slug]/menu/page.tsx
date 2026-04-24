import { prisma } from "@/lib/prisma";
import { getModuleSettings } from "@/lib/modules";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { IconWifi, IconClock } from "@tabler/icons-react";

type Props = {
  params:      Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
};

type MenuSettings = {
  table_number_param?: string;
  show_wifi?:          boolean;
  wifi_name?:          string;
  wifi_password?:      string;
  show_hours?:         boolean;
  hours?:              Record<string, string>;
  welcome_message?:    string;
};

export default async function MenuWelcomePage({ params, searchParams }: Props) {
  const { slug }  = await params;
  const query     = await searchParams;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true, name: true, description: true, primaryColor: true, logoUrl: true, bannerUrl: true },
  });
  if (!business) notFound();

  const settings  = (await getModuleSettings(business.id, "digital-menu")) as MenuSettings | null;
  const tableParam = settings?.table_number_param ?? "mesa";
  const tableNum   = query[tableParam];
  const color      = business.primaryColor ?? "blue";

  return (
    <>
      <style>{`
        .menu-page  { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; }
        .menu-card  { width: 100%; max-width: 480px; background: var(--mantine-color-body); display: flex; flex-direction: column; }
        .banner     { width: 100%; height: 140px; position: relative; overflow: hidden; background: linear-gradient(135deg, var(--mantine-color-${color}-6), var(--mantine-color-${color}-8)); }
        .banner img { width: 100%; height: 100%; object-fit: cover; }
        .logo-wrap  { display: flex; justify-content: center; margin-top: -28px; position: relative; z-index: 1; }
        .logo       { width: 56px; height: 56px; border-radius: 16px; background: var(--mantine-color-body); border: 3px solid var(--mantine-color-body); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: var(--mantine-color-${color}-6); box-shadow: 0 2px 10px rgba(0,0,0,.12); overflow: hidden; }
        .logo img   { width: 100%; height: 100%; object-fit: cover; }
        .body       { padding: 12px 20px 40px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .biz-name   { font-size: 20px; font-weight: 700; text-align: center; color: var(--mantine-color-text); }
        .table-badge { display: inline-flex; align-items: center; gap: 6px; margin: 0 auto; padding: 6px 16px; border-radius: 99px; background: var(--mantine-color-${color}-1); color: var(--mantine-color-${color}-7); font-size: 14px; font-weight: 600; }
        .welcome    { font-size: 14px; color: var(--mantine-color-dimmed); text-align: center; line-height: 1.6; }
        .cta        { display: block; width: 100%; padding: 14px; border-radius: 12px; background: var(--mantine-color-${color}-6); color: white; font-size: 15px; font-weight: 700; text-align: center; text-decoration: none; }
        .cta-outline { display: block; width: 100%; padding: 13px; border-radius: 12px; background: transparent; border: 2px solid var(--mantine-color-${color}-6); color: var(--mantine-color-${color}-6); font-size: 15px; font-weight: 700; text-align: center; text-decoration: none; }
        .info-card  { background: var(--mantine-color-default-hover); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
        .info-row   { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--mantine-color-text); }
        .info-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--mantine-color-dimmed); margin-bottom: 2px; }
        .divider    { height: 1px; background: var(--mantine-color-default-border); }
      `}</style>

      <div className="menu-page">
        <div className="menu-card">

          <div className="banner">
            {business.bannerUrl && <img src={business.bannerUrl} alt="banner" />}
          </div>

          <div className="logo-wrap">
            <div className="logo">
              {business.logoUrl
                ? <img src={business.logoUrl} alt="logo" />
                : business.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="body">
            <div className="biz-name">{business.name}</div>

            {tableNum && (
              <div style={{ display: "flex" }}>
                <div className="table-badge">🪑 Mesa {tableNum}</div>
              </div>
            )}

            {settings?.welcome_message && (
              <p className="welcome">{settings.welcome_message}</p>
            )}

            <div className="divider" />

            <Link href={`/${slug}/menu/categories`} className="cta">
              Ver menú completo
            </Link>

            <Link href={`/${slug}/menu/promotions`} className="cta-outline">
              Especiales del día
            </Link>

            {/* Wi-Fi */}
            {settings?.show_wifi && settings.wifi_name && (
              <>
                <div className="divider" />
                <div>
                  <div className="info-label">Wi-Fi</div>
                  <div className="info-card">
                    <div className="info-row">
                      <IconWifi size={16} color={`var(--mantine-color-${color}-6)`} />
                      <span style={{ fontWeight: 600 }}>{settings.wifi_name}</span>
                    </div>
                    {settings.wifi_password && (
                      <div className="info-row" style={{ color: "var(--mantine-color-dimmed)", fontSize: 13 }}>
                        Contraseña: <span style={{ fontWeight: 600, color: "var(--mantine-color-text)" }}>{settings.wifi_password}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Horarios */}
            {settings?.show_hours && settings.hours && Object.keys(settings.hours).length > 0 && (
              <>
                <div className="divider" />
                <div>
                  <div className="info-label">Horarios</div>
                  <div className="info-card">
                    {Object.entries(settings.hours).map(([area, hours]) => (
                      <div key={area} className="info-row">
                        <IconClock size={16} color={`var(--mantine-color-${color}-6)`} />
                        <div>
                          <span style={{ fontWeight: 600 }}>{area}:</span> {hours}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
