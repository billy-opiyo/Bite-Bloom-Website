"use client";

import { useEffect, useState } from "react";

export default function WishlistButton({ cakeId, cakeName }: { cakeId: string; cakeName: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/account/wishlist").then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json() as { data?: Array<{ cakeId: string }> };
      setSaved(Boolean(payload.data?.some((item) => item.cakeId === cakeId)));
    }).catch(() => undefined);
  }, [cakeId]);

  async function toggle() {
    setBusy(true);
    const response = saved
      ? await fetch(`/api/account/wishlist/${encodeURIComponent(cakeId)}`, { method: "DELETE" }).catch(() => null)
      : await fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cakeId }) }).catch(() => null);
    if (response?.ok) setSaved(!saved);
    setBusy(false);
  }

  return <button className={`heart-button ${saved ? "liked" : ""}`} disabled={busy} onClick={() => void toggle()} aria-label={`${saved ? "Remove" : "Save"} ${cakeName} ${saved ? "from" : "to"} wishlist`} type="button">♡</button>;
}
