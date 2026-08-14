"use client";

import { useEffect, useState } from "react";

export default function BrandedSplash() {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => setProgress((current) => current >= 100 ? 100 : current + 2), 28);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="splash-screen" aria-label={`Loading Bite and Bloom ${progress}%`}><div className="splash-mark">✦</div><p className="splash-brand">Bite <i>&amp;</i> Bloom</p><div className="splash-progress" role="progressbar" aria-valuemin={1} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><p className="splash-status">Warming the oven<span className="splash-dots" aria-hidden="true">...</span> <strong>{progress}%</strong></p></main>;
}
