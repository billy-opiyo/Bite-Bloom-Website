"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function BrandedSplash() {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(100, current + 2);
      });
    }, 28);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="splash-screen" aria-label={`Loading Bite and Bloom ${progress}%`}><div className="splash-mark"><Image className="splash-logo" src="/images/Bite%26Bloom%20icon.png" alt="" width={96} height={96} priority /></div><p className="splash-brand" aria-label="Bite and Bloom"><span className="splash-word splash-word-bite">Bite</span> <i className="splash-word splash-word-amp">&amp;</i> <span className="splash-word splash-word-bloom">Bloom</span></p><div className="splash-progress" role="progressbar" aria-valuemin={1} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><p className="splash-status">Warming the oven<span className="splash-dots" aria-hidden="true">...</span> <strong>{progress}%</strong></p></main>;
}
