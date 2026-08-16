"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SPLASH_DURATION_MS } from "./splash-timing";

const PROGRESS_STEPS = 99;
const PROGRESS_INTERVAL_MS = SPLASH_DURATION_MS / PROGRESS_STEPS;

export default function BrandedSplash() {
  const [progress, setProgress] = useState(1);
  const visibleDots = Math.min(3, Math.floor(progress / 34));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(100, current + 2);
      });
    }, PROGRESS_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="splash-screen" aria-label={`Loading Bite and Bloom ${progress}%`}><Image className="splash-background" src="/images/bitebloom%20background.png" alt="" fill priority sizes="100vw" /><div className="splash-mark"><Image className="splash-logo" src="/images/Bite%26Bloom%20icon.png" alt="" width={96} height={96} priority /></div><p className="splash-brand" aria-label="BITE AND BLOOM"><span className="splash-word splash-word-bite">BITE</span> <i className="splash-word splash-word-amp">&amp;</i> <span className="splash-word splash-word-bloom">BLOOM</span></p><div className="splash-progress" role="progressbar" aria-valuemin={1} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><p className="splash-status">WARMING THE OVEN<span className="splash-dots" aria-hidden="true">{[0, 1, 2].map((dot) => <span className={dot < visibleDots ? "splash-dot splash-dot-visible" : "splash-dot"} key={dot}>.</span>)}</span> <strong>{progress}%</strong></p></main>;
}
