"use client";

import { useState } from "react";
import Link from "next/link";
import { IconSearch, IconX, IconToolsKitchen2, IconStar, IconBell, IconShoppingBag } from "@tabler/icons-react";
import { useMenuList } from "../components/MenuListContext";

type Category = {
  id:           string;
  name:         string;
  emoji:        string;
  _count:       { items: number };
};

type Promotion = {
  id:          string;
  name:        string;
  type:        string;
  description: string | null;
};

type Props = {
  slug:       string;
  color:      string;
  tableNum?:  string;
  categories: Category[];
  promotions: Promotion[];
};

export default function CategoriesClient({ slug, color, tableNum, categories, promotions }: Props) {
  const [search, setSearch] = useState("");
  const { totalItems } = useMenuList();

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        .cat-page    { min-height: 100dvh; background: var(--mantine-color-default-hover); display: flex; justify-content: center; }
        .cat-card    { width: 100%; max-width: 480px; background: var(--mantine-color-body); display: flex; flex-direction: column; padding-bottom: 80px; }
        .cat-header  { background: var(--mantine-color-${color}-6); padding: 16px 16px 20px; color: white; }
        .cat-title   { font-size: 18px; font-weight: 700; margin: 0; }
        .cat-table   { font-size: 13px; opacity: .85; margin-top: 2px; }
        .search-wrap { padding: 12px 16px; background: var(--mantine-color-body); border-bottom: 1px solid var(--mantine-color-default-border); }
        .search-box  { display: flex; align-items: center; gap: 8px; background: var(--mantine-color-default-hover); border-radius: 10px; padding: 8px 12px; }
        .search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: var(--mantine-color-text); }
        .search-input::placeholder { color: var(--mantine-color-dimmed); }
        .body        { padding: 16px; flex: 1; }
        .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--mantine-color-dimmed); margin-bottom: 10px; }
        .promo-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; margin-bottom: 20px; }
        .promo-scroll::-webkit-scrollbar { display: none; }
        .promo-card  { flex-shrink: 0; width: 200px; background: linear-gradient(135deg, var(--mantine-color-${color}-6), var(--mantine-color-${color}-8)); border-radius: 12px; padding: 12px 14px; color: white; }
        .promo-type  { font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: .8; margin-bottom: 4px; }
        .promo-name  { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .promo-desc  { font-size: 12px; opacity: .85; line-height: 1.4; }
        .cat-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cat-item    { background: var(--mantine-color-body); border: 1px solid var(--mantine-color-default-border); border-radius: 14px; padding: 16px 12px; text-align: center; text-decoration: none; color: var(--mantine-color-text); display: flex; flex-direction: column; align-items: center; gap: 6px; transition: box-shadow .15s; }
        .cat-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,.08); }
        .cat-emoji   { font-size: 32px; line-height: 1; }
        .cat-name    { font-size: 14px; font-weight: 600; line-height: 1.3; }
        .cat-count   { font-size: 12px; color: var(--mantine-color-dimmed); }
        .empty       { text-align: center; padding: 40px 0; color: var(--mantine-color-dimmed); font-size: 14px; }
        .bottom-nav  { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: var(--mantine-color-body); border-top: 1px solid var(--mantine-color-default-border); display: flex; padding: 8px 0 calc(8px + env(safe-area-inset-bottom)); }
        .nav-btn     { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 0; border: none; background: transparent; cursor: pointer; font-size: 11px; color: var(--mantine-color-dimmed); text-decoration: none; }
        .nav-btn.active { color: var(--mantine-color-${color}-6); }
        .nav-badge   { position: absolute; top: -5px; right: -8px; background: var(--mantine-color-${color}-6); color: white; border-radius: 99px; font-size: 9px; font-weight: 700; padding: 1px 5px; min-width: 15px; text-align: center; line-height: 1.5; }
      `}</style>

      <div className="cat-page">
        <div className="cat-card">

          <div className="cat-header">
            <p className="cat-title">Menú completo</p>
            {tableNum && <p className="cat-table">🪑 Mesa {tableNum}</p>}
          </div>

          <div className="search-wrap">
            <div className="search-box">
              <IconSearch size={16} color="var(--mantine-color-dimmed)" />
              <input
                className="search-input"
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
                  <IconX size={14} color="var(--mantine-color-dimmed)" />
                </button>
              )}
            </div>
          </div>

          <div className="body">

            {promotions.length > 0 && !search && (
              <>
                <p className="section-label">⭐ Especiales de hoy</p>
                <div className="promo-scroll">
                  {promotions.map((p) => (
                    <Link key={p.id} href={`/${slug}/menu/promotions`} className="promo-card" style={{ textDecoration: "none" }}>
                      <p className="promo-type">{p.type}</p>
                      <p className="promo-name">{p.name}</p>
                      {p.description && <p className="promo-desc">{p.description}</p>}
                    </Link>
                  ))}
                </div>
              </>
            )}

            <p className="section-label">Categorías</p>
            {filtered.length > 0 ? (
              <div className="cat-grid">
                {filtered.map((c) => (
                  <Link key={c.id} href={`/${slug}/menu/categories/${c.id}`} className="cat-item">
                    <span className="cat-emoji">{c.emoji}</span>
                    <span className="cat-name">{c.name}</span>
                    <span className="cat-count">{c._count.items} platillos</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty">No se encontraron categorías</p>
            )}
          </div>

        </div>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <Link href={`/${slug}/menu/categories`} className="nav-btn active">
            <IconToolsKitchen2 size={20} />
            Menú
          </Link>
          <Link href={`/${slug}/menu/promotions`} className="nav-btn">
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
