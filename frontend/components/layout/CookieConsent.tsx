"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "bite-bloom-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  function save(value: "accepted" | "necessary") {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;
  return <aside className="cookie-consent" role="dialog" aria-label="Cookie preferences" aria-live="polite">
    <div><p className="eyebrow">Your privacy matters</p><h2>Keep the good stuff close.</h2><p>We use necessary storage for carts, security, and preferences. Optional measurement tools stay off until you choose.</p><Link href="/cookies">Read the cookie policy</Link></div>
    <div className="cookie-consent-actions"><button className="button button-outline" onClick={() => save("necessary")} type="button">Only necessary</button><button className="button button-dark" onClick={() => save("accepted")} type="button">Accept optional</button></div>
  </aside>;
}
