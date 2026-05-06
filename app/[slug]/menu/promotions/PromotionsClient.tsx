"use client";

import Link from "next/link";
import { IconArrowLeft, IconToolsKitchen2, IconStar, IconShoppingBag, IconBell, IconClock, IconCheck } from "@tabler/icons-react";
import { useMenuList } from "../components/MenuListContext";
import { useState } from "react";

type PromoItem = {
  itemId:   string;
  quantity: number;
  name:     string;
  emoji:    string | null;
  price:    string;
};

type Promotion = {
  id:              string;
  name:            string;
  type:            string;
  typeLabel:       string;
  description:     string | null;
  discountPercent: string | null;
  startTime:       string | null;
  endTime:         string | null;
  items:           PromoItem[];
};

type Props = {
  slug:        string;
  color:       string;
  promotions:  Promotion[];
  currentTime: string;
};

const TYPE_GRADIENT: Record<string, string> = {
  combo:    "linear-gradient(135deg, #667eea, #764ba2)",
  discount: "linear-gradient(135deg, #f093fb, #f5576c)",
  special:  "linear-gradient(135deg, #4facfe, #00f2fe)",
};

export default function PromotionsClient({ slug, color, promotions, currentTime }: Props) {
  const { dispatch, totalItems } = useMenuList();
  const [added, setAdded]       = useState<Record<string, boolean>>({});
  const [qty, setQty]           = useState<Record<string, number>>({});

  function getQty(id: string) { return qty[id] ?? 1; }
  function changeQty(id: string, delta: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));
  }

  function calcPrices(p: Promotion) {
    const original = p.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    const pct      = p.discountPercent ? Number(p.discountPercent) : 0;
    const final    = pct > 0 ? original * (1 - pct / 100) : original;
    return { original, final, pct };
  }

  function handleAdd(p: Promotion) {
    const { original, final } = calcPrices(p);
    const quantity = getQty(p.id);
    dispatch({
      type: "ADD_ITEM",
      payload: {
        itemId:     p.id,
        name:       p.name,
        emoji:      "🎁",
        basePrice:  original,
        totalPrice: final,
        quantity,
        modifiers: p.items.length > 0 ? [{
          modifierId:   "included",
          modifierName: "Incluye",
          optionIds:    p.items.map((i) => i.itemId),
          optionNames:  p.items.map((i) => `${i.emoji ?? ""} ${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`),
        }] : [],
        note: "",
      },
    });
    setAdded((prev) => ({ ...prev, [p.id]: true }));
  }

  return (
    <>
      <style>{`
        .promo-page   { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; }
        .promo-card   { width: 100%; max-width: 480px; background: var(--mantine-color-body); display: flex; flex-direction: column; padding-bottom: 80px; }
        .promo-header { position: sticky; top: 0; z-index: 10; background: var(--mantine-color-${color}-6); padding: 14px 16px; display: flex; align-items: center; gap: 12px; color: white; }
        .back-btn     { background: rgba(255,255,255,.2); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .time-chip    { margin-left: auto; display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,.2); border-radius: 99px; padding: 4px 10px; font-size: 12px; }
        .promo-body   { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--mantine-color-dimmed); margin-bottom: 4px; }
        .promo-item   { border-radius: 16px; overflow: hidden; }
        .promo-top    { padding: 18px 20px 14px; color: white; }
        .promo-badge  { display: inline-flex; self-align: flex-start; font-size: 11px; font-weight: 700; text-transform: uppercase; background: rgba(255,255,255,.25); border-radius: 99px; padding: 3px 10px; letter-spacing: .05em; }
        .promo-name   { font-size: 20px; font-weight: 800; line-height: 1.2; margin-top: 6px; }
        .promo-desc   { font-size: 13px; opacity: .9; line-height: 1.5; margin-top: 4px; }
        .promo-hours  { display: flex; align-items: center; gap: 5px; font-size: 12px; opacity: .8; margin-top: 8px; }
        .promo-items  { padding: 12px 20px; background: rgba(255,255,255,.15); display: flex; flex-direction: column; gap: 4px; }
        .promo-item-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: white; }
        .promo-item-qty { font-size: 12px; opacity: .75; }
        .price-row    { padding: 12px 20px 16px; display: flex; align-items: center; justify-content: space-between; }
        .price-orig   { font-size: 13px; color: rgba(255,255,255,.65); text-decoration: line-through; }
        .price-final  { font-size: 24px; font-weight: 800; color: white; }
        .price-pct    { font-size: 12px; background: rgba(255,255,255,.25); border-radius: 99px; padding: 2px 8px; color: white; font-weight: 700; }
        .qty-row      { margin: 0 20px 10px; display: flex; align-items: center; gap: 10px; }
        .qty-btn      { width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(255,255,255,.6); background: transparent; color: white; font-size: 20px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; flex-shrink: 0; }
        .qty-btn:disabled { opacity: .35; cursor: default; }
        .qty-value    { font-size: 18px; font-weight: 700; color: white; min-width: 24px; text-align: center; }
        .add-btn      { flex: 1; padding: 12px; border-radius: 12px; border: none; background: white; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .add-btn-wrap { margin: 0 20px 18px; display: flex; align-items: center; gap: 10px; }
        .add-btn.added { opacity: .7; cursor: default; }
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
                {promotions.map((p) => {
                  const { original, final, pct } = calcPrices(p);
                  const isAdded = added[p.id];
                  const hasPrice = original > 0;
                  const gradient = TYPE_GRADIENT[p.type] ?? `var(--mantine-color-${color}-6)`;
                  return (
                    <div key={p.id} className="promo-item" style={{ background: gradient }}>
                      <div className="promo-top">
                        <span className="promo-badge">{p.typeLabel}</span>
                        <div className="promo-name">{p.name}</div>
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

                      {p.items.length > 0 && (
                        <div className="promo-items">
                          {p.items.map((i) => (
                            <div key={i.itemId} className="promo-item-row">
                              <span>{i.emoji ?? "🍽️"}</span>
                              <span style={{ flex: 1 }}>{i.name}</span>
                              {i.quantity > 1 && <span className="promo-item-qty">×{i.quantity}</span>}
                              <span style={{ fontSize: 13, opacity: 0.8 }}>${(Number(i.price) * i.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {hasPrice && (
                        <div className="price-row">
                          <div>
                            {pct > 0 && <div className="price-orig">${original.toFixed(2)}</div>}
                            <div className="price-final">${final.toFixed(2)}</div>
                          </div>
                          {pct > 0 && <span className="price-pct">-{pct}%</span>}
                        </div>
                      )}

                      {!isAdded && (
                        <div className="qty-row">
                          <button
                            className="qty-btn"
                            disabled={getQty(p.id) <= 1}
                            onClick={() => changeQty(p.id, -1)}
                          >−</button>
                          <span className="qty-value">{getQty(p.id)}</span>
                          <button className="qty-btn" onClick={() => changeQty(p.id, 1)}>+</button>
                          {hasPrice && getQty(p.id) > 1 && (
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>
                              Total: ${(final * getQty(p.id)).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="add-btn-wrap">
                        <button
                          className={`add-btn ${isAdded ? "added" : ""}`}
                          style={{ color: p.type === "combo" ? "#667eea" : p.type === "discount" ? "#f5576c" : "#4facfe" }}
                          onClick={isAdded ? undefined : () => handleAdd(p)}
                        >
                          {isAdded
                            ? <><IconCheck size={16} strokeWidth={3} /> Agregado a tu lista</>
                            : "Agregar a mi lista"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

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
