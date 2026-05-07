"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconTrash,
  IconToolsKitchen2,
  IconStar,
  IconShoppingBag,
  IconBell,
  IconNote,
} from "@tabler/icons-react";
import { useMenuList } from "../components/MenuListContext";

type Props = {
  slug:  string;
  color: string;
};

export default function ListClient({ slug, color }: Props) {
  const { items, dispatch, totalItems, subtotal } = useMenuList();
  const router = useRouter();

  function handleShowWaiter() {
    router.push(`/${slug}/menu/list/waiter`);
  }

  return (
    <>
      <style>{`
        .list-page    { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; }
        .list-card    { width: 100%; max-width: 480px; background: var(--mantine-color-body); display: flex; flex-direction: column; padding-bottom: 100px; }
        .list-header  { position: sticky; top: 0; z-index: 10; background: var(--mantine-color-${color}-6); padding: 14px 16px; display: flex; align-items: center; gap: 12px; color: white; }
        .back-btn     { background: rgba(255,255,255,.2); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .list-body    { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .item-card    { background: var(--mantine-color-body); border: 1px solid var(--mantine-color-default-border); border-radius: 14px; overflow: hidden; }
        .item-top     { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px 10px; }
        .item-emoji   { font-size: 28px; line-height: 1; flex-shrink: 0; }
        .item-info    { flex: 1; min-width: 0; }
        .item-name    { font-size: 15px; font-weight: 600; color: var(--mantine-color-text); margin-bottom: 2px; }
        .item-mods    { font-size: 12px; color: var(--mantine-color-dimmed); line-height: 1.5; }
        .item-price   { font-size: 15px; font-weight: 700; color: var(--mantine-color-${color}-6); white-space: nowrap; }
        .item-actions { display: flex; align-items: center; gap: 8px; padding: 0 14px 12px; border-top: 1px solid var(--mantine-color-default-border); margin-top: 4px; padding-top: 10px; }
        .note-input   { flex: 1; border: none; background: var(--mantine-color-default-hover); border-radius: 8px; padding: 7px 10px; font-size: 13px; color: var(--mantine-color-text); outline: none; }
        .note-input::placeholder { color: var(--mantine-color-dimmed); }
        .remove-btn   { background: var(--mantine-color-red-0); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .item-right   { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .qty-row      { display: flex; align-items: center; gap: 5px; }
        .qty-btn      { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--mantine-color-${color}-6); background: transparent; color: var(--mantine-color-${color}-6); font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }
        .qty-btn:disabled { opacity: .35; cursor: default; }
        .qty-value    { font-size: 14px; font-weight: 700; min-width: 18px; text-align: center; color: var(--mantine-color-text); }
        .empty-state  { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-icon   { font-size: 48px; }
        .empty-title  { font-size: 17px; font-weight: 700; color: var(--mantine-color-text); }
        .empty-sub    { font-size: 14px; color: var(--mantine-color-dimmed); }
        .empty-cta    { margin-top: 8px; padding: 12px 24px; border-radius: 12px; background: var(--mantine-color-${color}-6); color: white; font-size: 14px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; }
        .summary-card { background: var(--mantine-color-default-hover); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
        .summary-row  { display: flex; justify-content: space-between; font-size: 14px; color: var(--mantine-color-dimmed); }
        .summary-total { display: flex; justify-content: space-between; font-size: 17px; font-weight: 700; color: var(--mantine-color-text); padding-top: 8px; border-top: 1px solid var(--mantine-color-default-border); }
        .clear-btn    { background: transparent; border: 1.5px solid var(--mantine-color-default-border); border-radius: 10px; padding: 10px; font-size: 13px; color: var(--mantine-color-dimmed); cursor: pointer; text-align: center; }
        .footer       { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; padding: 0 16px; }
        .waiter-btn   { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--mantine-color-${color}-6); color: white; font-size: 15px; font-weight: 700; cursor: pointer; }
        .bottom-nav   { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: var(--mantine-color-body); border-top: 1px solid var(--mantine-color-default-border); display: flex; padding: 8px 0 calc(8px + env(safe-area-inset-bottom)); }
        .nav-btn      { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 0; border: none; background: transparent; cursor: pointer; font-size: 11px; color: var(--mantine-color-dimmed); text-decoration: none; }
        .nav-btn.active { color: var(--mantine-color-${color}-6); }
        .nav-badge    { position: absolute; top: -5px; right: -8px; background: var(--mantine-color-${color}-6); color: white; border-radius: 99px; font-size: 9px; font-weight: 700; padding: 1px 5px; min-width: 15px; text-align: center; line-height: 1.5; }
      `}</style>

      <div className="list-page">
        <div className="list-card">

          <div className="list-header">
            <Link href={`/${slug}/menu/categories`}>
              <button className="back-btn" aria-label="Regresar">
                <IconArrowLeft size={16} color="white" />
              </button>
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Mi lista</span>
            {totalItems > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 13, opacity: 0.85 }}>
                {totalItems} {totalItems === 1 ? "platillo" : "platillos"}
              </span>
            )}
          </div>

          <div className="list-body">
            {items.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🛍️</span>
                <div className="empty-title">Tu lista está vacía</div>
                <div className="empty-sub">Agrega platillos desde el menú para armar tu pedido</div>
                <Link href={`/${slug}/menu/categories`} className="empty-cta">
                  Ver menú
                </Link>
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.key} className="item-card">
                    <div className="item-top">
                      <span className="item-emoji">{item.emoji ?? "🍽️"}</span>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        {item.modifiers.length > 0 && (
                          <div className="item-mods">
                            {item.modifiers.map((m) => (
                              <div key={m.modifierId}>
                                {m.modifierName}: {m.optionNames.join(", ")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="item-right">
                        <span className="item-price">${(item.totalPrice * item.quantity).toFixed(2)}</span>
                        <div className="qty-row">
                          <button
                            className="qty-btn"
                            disabled={item.quantity <= 1}
                            onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { key: item.key, quantity: item.quantity - 1 } })}
                          >−</button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { key: item.key, quantity: item.quantity + 1 } })}
                          >+</button>
                        </div>
                      </div>
                    </div>

                    <div className="item-actions">
                      <IconNote size={14} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                      <input
                        className="note-input"
                        placeholder="Nota para el mesero..."
                        value={item.note}
                        onChange={(e) =>
                          dispatch({ type: "UPDATE_NOTE", payload: { key: item.key, note: e.target.value } })
                        }
                      />
                      <button
                        className="remove-btn"
                        onClick={() => dispatch({ type: "REMOVE_ITEM", payload: { key: item.key } })}
                        aria-label="Eliminar"
                      >
                        <IconTrash size={14} color="var(--mantine-color-red-6)" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Resumen */}
                <div className="summary-card">
                  <div className="summary-row">
                    <span>Subtotal estimado</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mantine-color-dimmed)" }}>
                    * El total final puede variar. El mesero confirmará tu orden.
                  </div>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="clear-btn"
                  onClick={() => dispatch({ type: "CLEAR_LIST" })}
                >
                  Vaciar lista
                </button>
              </>
            )}
          </div>
        </div>

        {/* Botón mostrar al mesero */}
        {items.length > 0 && (
          <div className="footer">
            <button className="waiter-btn" onClick={handleShowWaiter}>
              Mostrar lista al mesero
            </button>
          </div>
        )}

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <Link href={`/${slug}/menu/categories`} className="nav-btn">
            <IconToolsKitchen2 size={20} />
            Menú
          </Link>
          <Link href={`/${slug}/menu/promotions`} className="nav-btn">
            <IconStar size={20} />
            Especiales
          </Link>
          <Link href={`/${slug}/menu/list`} className="nav-btn active">
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
