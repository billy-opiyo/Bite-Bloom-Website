"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import CakeCard from "../../../components/cakes/CakeCard";
import CakeFilters from "../../../components/cakes/CakeFilters";
import CakeSearch from "../../../components/cakes/CakeSearch";
import CakeSort, { type CakeSortValue } from "../../../components/cakes/CakeSort";
import PublicFloatingActions from "../../../components/layout/PublicFloatingActions";
import type { CatalogCake, CatalogCategory } from "../../../types/cake";

type ApiResponse = { data?: CatalogCake[]; error?: { message?: string } };

export default function CakesPage() {
  const searchParams = useSearchParams();
  const [cakes, setCakes] = useState<CatalogCake[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(() => searchParams.get("category") || "all");
  const [sort, setSort] = useState<CakeSortValue>("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadCakes() {
      try {
        const response = await fetch("/api/cakes", { signal: controller.signal });
        const payload = await response.json() as ApiResponse;
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "The catalogue is unavailable.");
        setCakes(payload.data);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "The catalogue is unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadCakes();
    return () => controller.abort();
  }, []);

  const categories = useMemo<CatalogCategory[]>(() => {
    const unique = new Map<string, CatalogCategory>();
    cakes.flatMap((cake) => cake.categories).forEach((item) => unique.set(item.slug, item));
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [cakes]);

  const visibleCakes = useMemo(() => cakes.filter((cake) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [cake.name, cake.description, ...cake.categories.map((item) => item.name)].some((value) => value?.toLowerCase().includes(query));
    return matchesSearch && (category === "all" || cake.categories.some((item) => item.slug === category));
  }).sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : Number(b.isFeatured) - Number(a.isFeatured)), [cakes, category, search, sort]);

  return (
    <main className="catalog-page">
      <header className="catalog-header"><div className="container catalog-header-row"><Link className="text-link" href="/">← Bite &amp; Bloom</Link><span className="eyebrow">Freshly baked across Nairobi</span></div><div className="container catalog-intro"><p className="eyebrow">The cake counter</p><h1>Find something <em>lovely.</em></h1><p>Browse our current collection, then make your favourite feel like yours.</p></div></header>
      <section className="catalog-content container" aria-labelledby="catalog-title"><div className="catalog-toolbar"><CakeSearch value={search} onChange={setSearch} /><CakeSort value={sort} onChange={setSort} /></div><CakeFilters categories={categories} value={category} onChange={setCategory} /><div className="catalog-results-heading"><div><p className="eyebrow">Our collection</p><h2 id="catalog-title">Cakes for every <em>moment.</em></h2></div><span>{loading ? "Loading…" : `${visibleCakes.length} cake${visibleCakes.length === 1 ? "" : "s"}`}</span></div>{loading && <div className="catalog-state" role="status"><span className="loading-mark">✦</span><p>Warming the cake counter…</p></div>}{!loading && error && <div className="catalog-state catalog-error" role="alert"><h2>The collection is resting.</h2><p>{error}</p><Link className="button button-dark" href="/">Back to the home page</Link></div>}{!loading && !error && visibleCakes.length === 0 && <div className="catalog-state"><h2>No cakes matched that search.</h2><p>Try another occasion or clear the filters.</p><button className="button button-outline" onClick={() => { setSearch(""); setCategory("all"); }} type="button">Clear filters</button></div>}{!loading && !error && visibleCakes.length > 0 && <div className="cake-grid">{visibleCakes.map((cake) => <CakeCard cake={cake} key={cake.id} />)}</div>}</section>
      <PublicFloatingActions message="Hi Bite & Bloom, I would love help choosing a cake." />
    </main>
  );
}
