"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { useMenuList } from "../../components/MenuListContext";

type ModifierOption = {
  id:          string;
  name:        string;
  extraPrice:  string | number;
  displayOrder: number;
};

type Modifier = {
  id:            string;
  name:          string;
  selectionType: string;
  isRequired:    boolean;
  options:       ModifierOption[];
};

type Item = {
  id:            string;
  name:          string;
  description:   string | null;
  price:         string | number;
  originalPrice: string | number | null;
  emoji:         string | null;
  imageUrl:      string | null;
  isVegetarian:  boolean;
  isGlutenFree:  boolean;
  isPopular:     boolean;
  isAvailable:   boolean;
  spiceLevel:    number;
  allergens:     string[];
  itemModifiers: { modifier: Modifier }[];
};

type Props = {
  slug:  string;
  color: string;
  item:  Item;
  categoryId: string;
};

export default function ItemDetailClient({ slug, color, item, categoryId }: Props) {
  const { dispatch } = useMenuList();
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [showSheet, setShowSheet]   = useState(false);
  const [saved, setSaved]           = useState(false);

  const modifiers = item.itemModifiers.map((im) => im.modifier);

  function selectSingle(modId: string, optId: string) {
    setSelections((prev) => ({ ...prev, [modId]: optId }));
  }

  function toggleMultiple(modId: string, optId: string) {
    setSelections((prev) => {
      const current = (prev[modId] as string[] | undefined) ?? [];
      return {
        ...prev,
        [modId]: current.includes(optId)
          ? current.filter((id) => id !== optId)
          : [...current, optId],
      };
    });
  }

  function calcExtra(): number {
    return modifiers.reduce((sum, mod) => {
      const sel = selections[mod.id];
      if (!sel) return sum;
      const ids = Array.isArray(sel) ? sel : [sel];
      return sum + mod.options
        .filter((o) => ids.includes(o.id))
        .reduce((s, o) => s + Number(o.extraPrice), 0);
    }, 0);
  }

  const basePrice  = Number(item.price);
  const totalPrice = basePrice + calcExtra();

  function handleSave() {
    const missing = modifiers.find(
      (m) => m.isRequired && !selections[m.id]
    );
    if (missing) {
      alert(`Selecciona una opción para "${missing.name}"`);
      return;
    }
    setShowSheet(true);
  }

  function confirmSave() {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        itemId:     item.id,
        name:       item.name,
        emoji:      item.emoji,
        basePrice:  Number(item.price),
        totalPrice,
        modifiers: modifiers
          .filter((mod) => selections[mod.id])
          .map((mod) => {
            const sel = selections[mod.id];
            const ids = Array.isArray(sel) ? sel : [sel];
            return {
              modifierId:   mod.id,
              modifierName: mod.name,
              optionIds:    ids,
              optionNames:  mod.options.filter((o) => ids.includes(o.id)).map((o) => o.name),
            };
          }),
        note: "",
      },
    });
    setSaved(true);
    setShowSheet(false);
  }

  const selectedSummary = modifiers
    .map((mod) => {
      const sel = selections[mod.id];
      if (!sel) return null;
      const ids = Array.isArray(sel) ? sel : [sel];
      const names = mod.options.filter((o) => ids.includes(o.id)).map((o) => o.name);
      return names.length ? `${mod.name}: ${names.join(", ")}` : null;
    })
    .filter(Boolean);

  return (
    <>
      <style>{`
        .detail-page   { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; }
        .detail-card   { width: 100%; max-width: 480px; background: var(--mantine-color-body); display: flex; flex-direction: column; padding-bottom: 100px; }
        .detail-header { position: sticky; top: 0; z-index: 10; background: var(--mantine-color-${color}-6); padding: 14px 16px; display: flex; align-items: center; gap: 12px; color: white; }
        .back-btn      { background: rgba(255,255,255,.2); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .media         { width: 100%; aspect-ratio: 4/3; background: var(--mantine-color-default-hover); display: flex; align-items: center; justify-content: center; font-size: 80px; overflow: hidden; }
        .media img     { width: 100%; height: 100%; object-fit: cover; }
        .body          { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .item-name     { font-size: 22px; font-weight: 700; color: var(--mantine-color-text); }
        .price-row     { display: flex; align-items: baseline; gap: 8px; }
        .price         { font-size: 22px; font-weight: 700; color: var(--mantine-color-${color}-6); }
        .orig-price    { font-size: 15px; color: var(--mantine-color-dimmed); text-decoration: line-through; }
        .tags          { display: flex; gap: 6px; flex-wrap: wrap; }
        .tag           { font-size: 12px; padding: 3px 10px; border-radius: 99px; background: var(--mantine-color-default-hover); color: var(--mantine-color-dimmed); }
        .tag.green     { background: var(--mantine-color-green-1); color: var(--mantine-color-green-7); }
        .description   { font-size: 14px; color: var(--mantine-color-dimmed); line-height: 1.7; }
        .divider       { height: 1px; background: var(--mantine-color-default-border); }
        .mod-section   { display: flex; flex-direction: column; gap: 10px; }
        .mod-title     { font-size: 15px; font-weight: 700; color: var(--mantine-color-text); }
        .mod-required  { font-size: 11px; color: var(--mantine-color-red-6); font-weight: 600; margin-left: 6px; }
        .mod-options   { display: flex; flex-direction: column; gap: 6px; }
        .mod-option    { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--mantine-color-default-border); cursor: pointer; background: var(--mantine-color-body); }
        .mod-option.selected { border-color: var(--mantine-color-${color}-6); background: var(--mantine-color-${color}-0); }
        .mod-circle    { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--mantine-color-default-border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .mod-square    { width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--mantine-color-default-border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .mod-option.selected .mod-circle,
        .mod-option.selected .mod-square { background: var(--mantine-color-${color}-6); border-color: var(--mantine-color-${color}-6); }
        .mod-opt-name  { flex: 1; font-size: 14px; color: var(--mantine-color-text); }
        .mod-opt-price { font-size: 13px; color: var(--mantine-color-dimmed); }
        .allergen-box  { background: var(--mantine-color-yellow-0); border: 1px solid var(--mantine-color-yellow-3); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: var(--mantine-color-yellow-8); }
        .footer        { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: var(--mantine-color-body); border-top: 1px solid var(--mantine-color-default-border); }
        .save-btn      { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--mantine-color-${color}-6); color: white; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
        .save-btn.saved { background: var(--mantine-color-green-6); }
        /* Sheet */
        .sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
        .sheet         { width: 100%; max-width: 480px; background: var(--mantine-color-body); border-radius: 20px 20px 0 0; padding: 20px 20px calc(20px + env(safe-area-inset-bottom)); }
        .sheet-handle  { width: 40px; height: 4px; border-radius: 2px; background: var(--mantine-color-default-border); margin: 0 auto 16px; }
        .sheet-title   { font-size: 17px; font-weight: 700; margin-bottom: 12px; }
        .sheet-row     { font-size: 13px; color: var(--mantine-color-dimmed); margin-bottom: 4px; }
        .sheet-total   { font-size: 18px; font-weight: 700; color: var(--mantine-color-${color}-6); margin: 12px 0; }
        .sheet-btn     { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--mantine-color-${color}-6); color: white; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; }
        .sheet-cancel  { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid var(--mantine-color-default-border); background: transparent; color: var(--mantine-color-text); font-size: 14px; cursor: pointer; margin-top: 8px; }
      `}</style>

      <div className="detail-page">
        <div className="detail-card">

          <div className="detail-header">
            <Link href={`/${slug}/menu/categories/${categoryId}`}>
              <button className="back-btn" aria-label="Regresar">
                <IconArrowLeft size={16} color="white" />
              </button>
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>
          </div>

          {/* Imagen o emoji */}
          <div className="media">
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.name} />
              : (item.emoji ?? "🍽️")}
          </div>

          <div className="body">
            <div className="item-name">{item.name}</div>

            <div className="price-row">
              <span className="price">${totalPrice.toFixed(2)}</span>
              {item.originalPrice && (
                <span className="orig-price">${Number(item.originalPrice).toFixed(2)}</span>
              )}
            </div>

            <div className="tags">
              {item.isPopular    && <span className="tag green">⭐ Popular</span>}
              {item.isVegetarian && <span className="tag green">🌿 Vegetariano</span>}
              {item.isGlutenFree && <span className="tag green">🌾 Sin gluten</span>}
              {item.spiceLevel > 0 && <span className="tag">{"🌶️".repeat(item.spiceLevel)} Picante</span>}
              {!item.isAvailable && <span className="tag" style={{ background: "var(--mantine-color-red-1)", color: "var(--mantine-color-red-7)" }}>Agotado</span>}
            </div>

            {item.description && <p className="description">{item.description}</p>}

            {/* Modificadores */}
            {modifiers.map((mod) => {
              const sel = selections[mod.id];
              return (
                <div key={mod.id}>
                  <div className="divider" />
                  <div className="mod-section">
                    <div className="mod-title">
                      {mod.name}
                      {mod.isRequired && <span className="mod-required">Requerido</span>}
                    </div>
                    <div className="mod-options">
                      {mod.options.map((opt) => {
                        const isSelected = mod.selectionType === "single"
                          ? sel === opt.id
                          : (sel as string[] | undefined)?.includes(opt.id) ?? false;

                        return (
                          <div
                            key={opt.id}
                            className={`mod-option ${isSelected ? "selected" : ""}`}
                            onClick={() =>
                              mod.selectionType === "single"
                                ? selectSingle(mod.id, opt.id)
                                : toggleMultiple(mod.id, opt.id)
                            }
                          >
                            <div className={mod.selectionType === "single" ? "mod-circle" : "mod-square"}>
                              {isSelected && <IconCheck size={11} color="white" strokeWidth={3} />}
                            </div>
                            <span className="mod-opt-name">{opt.name}</span>
                            {Number(opt.extraPrice) > 0 && (
                              <span className="mod-opt-price">+${Number(opt.extraPrice).toFixed(2)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Alérgenos */}
            {item.allergens.length > 0 && (
              <>
                <div className="divider" />
                <div className="allergen-box">
                  ⚠️ <strong>Alérgenos:</strong> {item.allergens.join(", ")}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer fijo */}
        <div className="footer">
          <button
            className={`save-btn ${saved ? "saved" : ""}`}
            onClick={saved ? undefined : handleSave}
            disabled={!item.isAvailable}
          >
            <span>{saved ? "✓ Guardado en tu lista" : item.isAvailable ? "Guardar en mi lista" : "No disponible"}</span>
            <span>${totalPrice.toFixed(2)}</span>
          </button>
        </div>

        {/* Sheet de confirmación */}
        {showSheet && (
          <div className="sheet-overlay" onClick={() => setShowSheet(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="sheet-title">¿Agregar a tu lista?</div>
              <div className="sheet-row" style={{ fontWeight: 600, color: "var(--mantine-color-text)", fontSize: 15 }}>
                {item.name}
              </div>
              {selectedSummary.map((s, i) => (
                <div key={i} className="sheet-row">• {s}</div>
              ))}
              <div className="sheet-total">${totalPrice.toFixed(2)}</div>
              <button className="sheet-btn" onClick={confirmSave}>
                Sí, guardar
              </button>
              <button className="sheet-cancel" onClick={() => setShowSheet(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
