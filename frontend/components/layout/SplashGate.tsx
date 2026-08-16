"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import BrandedSplash from "./BrandedSplash";
import { SPLASH_DURATION_MS } from "./splash-timing";

export default function SplashGate({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let handoffTimer: number | undefined;
    const handOffToHome = () => {
      handoffTimer = window.setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    };

    if (document.readyState === "complete") {
      handOffToHome();
    } else {
      window.addEventListener("load", handOffToHome, { once: true });
    }

    return () => {
      window.removeEventListener("load", handOffToHome);
      if (handoffTimer !== undefined) window.clearTimeout(handoffTimer);
    };
  }, []);

  return showSplash ? <BrandedSplash /> : <>{children}</>;
}
