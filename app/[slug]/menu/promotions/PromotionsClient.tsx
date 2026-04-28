"use client";

import Link from "next/link";
import { IconArrowLeft, IconToolsKitchen2, IconStar, IconShoppingBag, IconBell, IconClock } from "@tabler/icons-react";
import { useMenuList } from "../components/MenuListContext";

type Promotion = {
  id:             string;
  name:           string;
  type:           string;
  typeLabel:      string;
  description:    string | null;
  discountAmount: string | null;
  startTime:      string | null;
  endTime:        string | null;
};

type Props = {
  slug:         string;
  color:        string;
  promotions:   Promotion[];
  currentTime:  string;
};

const TYPE_GRADIENT: Record<string, string> = {
  combo:    "linear-gradient(135deg, #667eea, #764ba2)",
  discount: "linear-gradient(135deg, #f093fb, #f5576c)",
  special:  "linear-gradient(135deg, #4facfe, #00f2fe)",
};

export default function PromotionsClient({ slug, color, promotions, currentTime }: Props) {
  const { totalItems } = useMenuList();

  return (
    <>
      <style>{`
        .promo-page   { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; }
        .promo-card   { width: 100%; max-width: 480px; background: var(--mantine-color-body); display: flex; flex-direction: column; padding-bottom: 80px; }
        .promo-header { position: sticky; top: 0; z-index: 10; background: var(--mantine-color-${color}-6); padding: 14px 16px; display: flex; align-items: center; gap: 12px; color: white; }
        .back-btn     { background: rgba(255,255,255,.2); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .time-chip    { margin-left: auto; display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,.2); border-radius: 99px; padding: 4px 10px; font-size: 12px; }
        .promo-body   { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--mantine-color-dimmed); margin-bottom: 4px; }
        .promo-item   { border-radius: 16px; padding: 18px 20px; color: white; display: flex; flex-direction: column; gap: 6px; }
        .promo-badge  { display: inline-flex; align-self: flex-start; font-size: 11px; font-weight: 700; text-transform: uppercase; background: rgba(255,255,255,.25); border-radius: 99px; padding: 3px 10px; letter-spacing: .05em; }
        .promo-name   { font-size: 20px; font-weight: 800; line-height: 1.2; }
        .promo-desc   { font-size: 14px; opacity: .9; line-height: 1.5; }
        .promo-discount { font-size: 24px; font-weight: 800; }
        .promo-hours  { display: flex; align-items: center; gap: 5px; font-size: 12px; opacity: .8; margin-top: 4px; }
        .empty-state  { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-icon   { font-size: 48px; }
        .empty-title  { font-size: 17px; font-weight: 700; color: var(--mantine-color-text); }
        .empty-sub    { font-size: 14px; color: var(--mantine-color-dimmed); line-height: 1.6; }
        .bottom-nav   { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: var(--mantine-color-body); border-top: 1px solid var(--mantine-color-default-border); display: flex; padding: 8px 0 calc(8px + env(safe-area-inset-bottom)); }
        .nav-btn      { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 0; border: none; background: transparent; cursor: pointer; font-size: 11px; color: var(--mantine-color-dimmed); text-decoration: none; }
        .nav-btn.active { color: var(--mantine-color-${color}-6); }
        .nav-badge    { position: absolute; top: -5px; right: -8px; background: var(--mantine-color-${color}-6); color: white; border-radius: 99px; font-size: 9px; font-weight: 700; padding: 1px 5px; min-width: 15px; text-align: center; line-height: 1.5; }
      `}</style>

      <div className="promo-page">
        <div className="promo-card">

          <div className="promo-header">
            <Link href={`/${slug}/menu/categories`}>
              <button className="back-btn" aria-label="Regresar">
                <IconArrowLeft size={16} color="white" />
              </button>
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Especiales de hoy</span>
            <div className="time-chip">
              <IconClock size={11} />
              {currentTime}
            </div>
          </div>

          <div className="promo-body">
            {promotions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🌟</span>
                <div className="empty-title">Sin especiales por ahora</div>
                <div className="empty-sub">
                  Los especiales del día aparecen aquí cuando están disponibles.
                  Vuelve a revisar más tarde.
                </div>
                <Link
                  href={`/${slug}/menu/categories`}
                  style={{ marginTop: 8, padding: "12px 24px", borderRadius: 12, background: `var(--mantine-color-${color}-6)`, color: "white", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
                >
                  Ver menú completo
                </Link>
              </div>
            ) : (
              <>
                <p className="section-label">⭐ {promotions.length} {promotions.length === 1 ? "especial activo" : "especiales activos"}</p>
                {promotions.map((p) => (
                  <div
                    key={p.id}
                    className="promo-item"
                    style={{ background: TYPE_GRADIENT[p.type] ?? `var(--mantine-color-${color}-6)` }}
                  >
                    <span className="promo-badge">{p.typeLabel}</span>
                    <div className="promo-name">{p.name}</div>
                    {p.discountAmount && (
                      <div className="promo-discount">-${Number(p.discountAmount).toFixed(2)}</div>
                    )}
                    {p.description && <div className="promo-desc">{p.description}</div>}
                    {(p.startTime || p.endTime) && (
                      <div className="promo-hours">
                        <IconClock size={11} />
                        {p.startTime && p.endTime
                          ? `${p.startTime} – ${p.endTime}`
                          : p.startTime
                          ? `Desde ${p.startTime}`
                          : `Hasta ${p.endTime}`}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <Link href={`/${slug}/menu/categories`} className="nav-btn">
            <IconToolsKitchen2 size={20} />
            Menú
          </Link>
          <Link href={`/${slug}/menu/promotions`} className="nav-btn active">
            <IconStar size={20} />
            Especiales
          </Link>
          <Link href={`/${slug}/menu/list`} className="nav-btn">
            <div style={{ position: "relative" }}>
              <IconShoppingBag size={20} />
              {totalItems > 0 && <span className="nav-badge">{totalItems}</span>}
            </div>
            Mi lista
          </Link>
          <button className="nav-btn" onClick={() => alert("Llama a tu mesero o levanta la mano 👋")}>
            <IconBell size={20} />
            Mesero
          </button>
        </nav>
      </div>
    </>
  );
}
