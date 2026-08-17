"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import CakeCard from "../../../components/cakes/CakeCard";
import CakeFilters from "../../../components/cakes/CakeFilters";
import CakeSearch from "../../../components/cakes/CakeSearch";
import CakeSort, { type CakeSortValue } from "../../../components/cakes/CakeSort";
import PublicFloatingActions from "../../../components/layout/PublicFloatingActions";
import type { CatalogCake, CatalogCategory } from "../../../types/cake";

type ApiResponse = { data?: { items: CatalogCake[]; categories: CatalogCategory[]; hasMore: boolean; page: number; pageSize: number; total: number }; error?: { message?: string } };

export default function CakesPage() {
  const searchParams = useSearchParams();
  const [cakes, setCakes] = useState<CatalogCake[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(() => searchParams.get("category") || "all");
  const [sort, setSort] = useState<CakeSortValue>("featured");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<CatalogCategory[]>([]);
  const [error, setError] = useState("");
  const requestGeneration = useRef(0);

  const catalogUrl = useMemo(() => (nextPage: number) => {
    const params = new URLSearchParams({ page: String(nextPage), pageSize: "48", sort });
    if (search.trim()) params.set("q", search.trim());
    if (category !== "all") params.set("category", category);
    return `/api/cakes?${params.toString()}`;
  }, [category, search, sort]);

  useEffect(() => {
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    const controller = new AbortController();
    async function loadCakes() {
      setLoading(true);
      setLoadingMore(false);
      setPage(1);
      setCakes([]);
      setHasMore(false);
      setError("");
      try {
        const response = await fetch(catalogUrl(1), { signal: controller.signal });
        const payload = await response.json() as ApiResponse;
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "The catalogue is unavailable.");
        if (generation !== requestGeneration.current) return;
        setCakes(payload.data.items);
        setAvailableCategories(payload.data.categories);
        setHasMore(payload.data.hasMore);
      } catch (cause) {
        if (!controller.signal.aborted && generation === requestGeneration.current) setError(cause instanceof Error ? cause.message : "The catalogue is unavailable.");
      } finally {
        if (!controller.signal.aborted && generation === requestGeneration.current) setLoading(false);
      }
    }
    void loadCakes();
    return () => controller.abort();
  }, [catalogUrl]);

  async function loadMore() {
    if (loading || loadingMore || !hasMore) return;
    const generation = requestGeneration.current;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(catalogUrl(nextPage));
      const payload = await response.json() as ApiResponse;
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "More cakes are unavailable.");
      if (generation !== requestGeneration.current) return;
      setCakes((current) => [...current, ...payload.data!.items]);
      setAvailableCategories(payload.data.categories);
      setPage(nextPage);
      setHasMore(payload.data.hasMore);
    } catch (cause) {
      if (generation === requestGeneration.current) setError(cause instanceof Error ? cause.message : "More cakes are unavailable.");
    } finally {
      if (generation === requestGeneration.current) setLoadingMore(false);
    }
  }

  const categories = useMemo(() => availableCategories, [availableCategories]);

  const visibleCakes = useMemo(() => cakes, [cakes]);

  return (
    <main className="catalog-page">
      <header className="catalog-header"><div className="container catalog-header-row"><Link className="text-link" href="/">← Bite &amp; Bloom</Link><span className="eyebrow">Freshly baked across Nairobi</span></div><div className="container catalog-intro"><p className="eyebrow">The cake counter</p><h1>Find something <em>lovely.</em></h1><p>Browse our current collection, then make your favourite feel like yours.</p></div></header>
      <section className="catalog-content container" aria-labelledby="catalog-title"><div className="catalog-toolbar"><CakeSearch value={search} onChange={setSearch} /><CakeSort value={sort} onChange={setSort} /></div><CakeFilters categories={categories} value={category} onChange={setCategory} /><div className="catalog-results-heading"><div><p className="eyebrow">Our collection</p><h2 id="catalog-title">Cakes for every <em>moment.</em></h2></div><span>{loading ? "Loading…" : `${visibleCakes.length} cake${visibleCakes.length === 1 ? "" : "s"}`}</span></div>{loading && <div className="catalog-state" role="status"><span className="loading-mark">✦</span><p>Warming the cake counter…</p></div>}{!loading && error && <div className="catalog-state catalog-error" role="alert"><h2>The collection is resting.</h2><p>{error}</p><Link className="button button-dark" href="/">Back to the home page</Link></div>}{!loading && !error && visibleCakes.length === 0 && <div className="catalog-state"><h2>No cakes matched that search.</h2><p>Try another occasion or clear the filters.</p><button className="button button-outline" onClick={() => { setSearch(""); setCategory("all"); }} type="button">Clear filters</button></div>}{!loading && !error && visibleCakes.length > 0 && <><div className="cake-grid">{visibleCakes.map((cake) => <CakeCard cake={cake} key={cake.id} />)}</div>{hasMore && <div className="catalog-load-more"><button className="button button-outline" disabled={loadingMore} onClick={() => void loadMore()} type="button">{loadingMore ? "Loading more…" : "Load more cakes"}</button></div>}</>}</section>
      <PublicFloatingActions message="Hi Bite & Bloom, I would love help choosing a cake." />
    </main>
  );
}
