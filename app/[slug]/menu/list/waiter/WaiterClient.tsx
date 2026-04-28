"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconCheck } from "@tabler/icons-react";
import { useMenuList } from "../../components/MenuListContext";

type Props = {
  slug:  string;
  color: string;
};

export default function WaiterClient({ slug, color }: Props) {
  const { items, dispatch, subtotal } = useMenuList();
  const router = useRouter();

  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${slug}/menu/categories`);
    }
  }, [items.length, router, slug]);

  function handleDone() {
    dispatch({ type: "CLEAR_LIST" });
    router.push(`/${slug}/menu/categories`);
  }

  if (items.length === 0) return null;

  return (
    <>
      <style>{`
        .waiter-page  { min-height: 100dvh; background: var(--mantine-color-${color}-6); display: flex; justify-content: center; padding: 0 0 120px; }
        .waiter-card  { width: 100%; max-width: 480px; display: flex; flex-direction: column; }
        .waiter-top   { padding: 32px 20px 20px; color: white; }
        .waiter-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; opacity: .75; margin-bottom: 4px; }
        .waiter-title { font-size: 28px; font-weight: 800; line-height: 1.2; }
        .items-list   { display: flex; flex-direction: column; gap: 12px; padding: 16px 16px 0; }
        .item-block   { background: rgba(255,255,255,.15); border-radius: 16px; padding: 16px 18px; }
        .item-row     { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .item-name    { font-size: 22px; font-weight: 800; color: white; line-height: 1.2; flex: 1; }
        .item-price   { font-size: 20px; font-weight: 700; color: rgba(255,255,255,.9); white-space: nowrap; }
        .item-mods    { margin-top: 8px; display: flex; flex-direction: column; gap: 3px; }
        .mod-line     { font-size: 15px; color: rgba(255,255,255,.8); }
        .item-note    { margin-top: 10px; background: rgba(0,0,0,.15); border-radius: 8px; padding: 8px 12px; font-size: 14px; color: rgba(255,255,255,.9); font-style: italic; }
        .divider      { height: 1px; background: rgba(255,255,255,.2); margin: 20px 16px 0; }
        .total-row    { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 0; }
        .total-label  { font-size: 16px; font-weight: 600; color: rgba(255,255,255,.8); }
        .total-amount { font-size: 28px; font-weight: 800; color: white; }
        .footer       { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; padding: 16px 16px calc(16px + env(safe-area-inset-bottom)); background: rgba(0,0,0,.2); backdrop-filter: blur(8px); }
        .done-btn     { width: 100%; padding: 16px; border-radius: 14px; border: none; background: white; color: var(--mantine-color-${color}-6); font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
      `}</style>

      <div className="waiter-page">
        <div className="waiter-card">

          <div className="waiter-top">
            <div className="waiter-label">Pedido del cliente</div>
            <div className="waiter-title">
              {items.length} {items.length === 1 ? "platillo" : "platillos"}
            </div>
          </div>

          <div className="items-list">
            {items.map((item, idx) => (
              <div key={item.key} className="item-block">
                <div className="item-row">
                  <div className="item-name">
                    {idx + 1}. {item.emoji ?? "🍽️"} {item.name}
                  </div>
                  <div className="item-price">${item.totalPrice.toFixed(2)}</div>
                </div>

                {item.modifiers.length > 0 && (
                  <div className="item-mods">
                    {item.modifiers.map((m) => (
                      <div key={m.modifierId} className="mod-line">
                        • {m.modifierName}: {m.optionNames.join(", ")}
                      </div>
                    ))}
                  </div>
                )}

                {item.note && (
                  <div className="item-note">📝 {item.note}</div>
                )}
              </div>
            ))}
          </div>

          <div className="divider" />

          <div className="total-row">
            <span className="total-label">Total estimado</span>
            <span className="total-amount">${subtotal.toFixed(2)}</span>
          </div>

        </div>
      </div>

      <div className="footer">
        <button className="done-btn" onClick={handleDone}>
          <IconCheck size={20} strokeWidth={3} />
          Pedido tomado
        </button>
      </div>
    </>
  );
}
