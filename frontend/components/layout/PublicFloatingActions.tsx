"use client";

import { useEffect, useState } from "react";
import { whatsappLink } from "../../lib/site-config";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M6.5 3.5 9 3l2 4-2 1.5a14 14 0 0 0 6.5 6.5L17 13l4 2-.5 2.5A3 3 0 0 1 17.6 20C10 19.3 4.7 14 4 6.4A3 3 0 0 1 6.5 3.5Z" />
    </svg>
  );
}

export default function PublicFloatingActions({ message }: { message: string }) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 300);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <a
        className="whatsapp-float"
        href={whatsappLink(message)}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <WhatsAppIcon />
        <span className="whatsapp-float-label">Chat with us</span>
      </a>

      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top" type="button">
          <ArrowIcon />
        </button>
      )}
    </>
  );
}
