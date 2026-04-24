"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconLeaf, IconFlame, IconAlertTriangle } from "@tabler/icons-react";

type Item = {
  id:          string;
  name:        string;
  description: string | null;
  price:       string | number;
  originalPrice: string | number | null;
  emoji:       string | null;
  imageUrl:    string | null;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isPopular:   boolean;
  isAvailable: boolean;
  spiceLevel:  number;
  allergens:   string[];
};

type Props = {
  slug:         string;
  color:        string;
  categoryName: string;
  categoryEmoji: string;
  items:        Item[];
};

type Filter = "all" | "vegetarian" | "gluten_free" | "spicy";

export default function ItemsClient({ slug, color, categoryName, categoryEmoji, items }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = items.filter((item) => {
    if (filter === "vegetarian")  return item.isVegetarian;
    if (filter === "gluten_free") return item.isGlutenFree;
    if (filter === "spicy")       return item.spiceLevel > 0;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all",         label: "Todo" },
    { key: "vegetarian",  label: "🌿 Vegetariano" },
    { key: "gluten_free", label: "🌾 Sin gluten" },
    { key: "spicy",       label: "🌶️ Picante" },
  ];

  return (
    <>
      <style>{`
        .items-page  { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; }
        .items-card  { width: 100%; max-width: 480px; background: var(--mantine-color-body); display: flex; flex-direction: column; padding-bottom: 24px; }
        .items-header { background: var(--mantine-color-${color}-6); padding: 14px 16px; display: flex; align-items: center; gap: 12px; color: white; }
        .back-btn    { background: rgba(255,255,255,.2); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .header-title { font-size: 17px; font-weight: 700; }
        .filters     { display: flex; gap: 8px; padding: 12px 16px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--mantine-color-default-border); background: var(--mantine-color-body); }
        .filters::-webkit-scrollbar { display: none; }
        .filter-chip { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1.5px solid var(--mantine-color-default-border); background: transparent; font-size: 13px; cursor: pointer; color: var(--mantine-color-text); white-space: nowrap; }
        .filter-chip.active { background: var(--mantine-color-${color}-6); border-color: var(--mantine-color-${color}-6); color: white; font-weight: 600; }
        .allergen-banner { display: flex; align-items: center; gap: 8px; margin: 12px 16px; padding: 10px 14px; background: var(--mantine-color-yellow-0); border: 1px solid var(--mantine-color-yellow-3); border-radius: 10px; font-size: 12px; color: var(--mantine-color-yellow-8); }
        .items-list  { display: flex; flex-direction: column; gap: 1px; background: var(--mantine-color-default-border); }
        .item-row    { display: flex; gap: 12px; padding: 14px 16px; background: var(--mantine-color-body); text-decoration: none; color: var(--mantine-color-text); align-items: flex-start; }
        .item-media  { width: 64px; height: 64px; border-radius: 10px; flex-shrink: 0; overflow: hidden; background: var(--mantine-color-default-hover); display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .item-media img { width: 100%; height: 100%; object-fit: cover; }
        .item-info   { flex: 1; min-width: 0; }
        .item-name   { font-size: 15px; font-weight: 600; margin-bottom: 3px; }
        .item-desc   { font-size: 13px; color: var(--mantine-color-dimmed); line-height: 1.4; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .tags        { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
        .tag         { font-size: 11px; padding: 2px 7px; border-radius: 99px; background: var(--mantine-color-default-hover); color: var(--mantine-color-dimmed); }
        .tag.popular { background: var(--mantine-color-${color}-1); color: var(--mantine-color-${color}-7); }
        .tag.unavail { background: var(--mantine-color-red-1); color: var(--mantine-color-red-7); }
        .item-price  { font-size: 15px; font-weight: 700; color: var(--mantine-color-${color}-6); }
        .item-orig   { font-size: 12px; color: var(--mantine-color-dimmed); text-decoration: line-through; margin-left: 4px; }
        .empty       { text-align: center; padding: 48px 20px; color: var(--mantine-color-dimmed); font-size: 14px; }
      `}</style>

      <div className="items-page">
        <div className="items-card">

          <div className="items-header">
            <Link href={`/${slug}/menu/categories`}>
              <button className="back-btn" aria-label="Regresar">
                <IconArrowLeft size={16} color="white" />
              </button>
            </Link>
            <span style={{ fontSize: 20 }}>{categoryEmoji}</span>
            <span className="header-title">{categoryName}</span>
          </div>

          <div className="filters">
            {filters.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="allergen-banner">
            <IconAlertTriangle size={14} />
            Si tienes alergias alimentarias, consulta con tu mesero antes de ordenar.
          </div>

          {filtered.length > 0 ? (
            <div className="items-list">
              {filtered.map((item) => (
                <Link key={item.id} href={`/${slug}/menu/items/${item.id}`} className="item-row">
                  <div className="item-media">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} />
                      : (item.emoji ?? "🍽️")}
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    {item.description && <div className="item-desc">{item.description}</div>}
                    <div className="tags">
                      {item.isPopular    && <span className="tag popular">⭐ Popular</span>}
                      {item.isVegetarian && <span className="tag">🌿 Veg</span>}
                      {item.isGlutenFree && <span className="tag">🌾 Sin gluten</span>}
                      {item.spiceLevel > 0 && <span className="tag">{"🌶️".repeat(item.spiceLevel)}</span>}
                      {!item.isAvailable && <span className="tag unavail">Agotado</span>}
                    </div>
                    <div>
                      <span className="item-price">
                        ${Number(item.price).toFixed(2)}
                      </span>
                      {item.originalPrice && (
                        <span className="item-orig">${Number(item.originalPrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">No hay platillos con ese filtro</p>
          )}

        </div>
      </div>
    </>
  );
}
