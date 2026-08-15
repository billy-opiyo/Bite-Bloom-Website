"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { LuArrowUp } from "react-icons/lu";
import { whatsappLink } from "../../lib/site-config";

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
        <FaWhatsapp aria-hidden="true" />
        <span className="whatsapp-float-label">Chat with us</span>
      </a>

      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top" type="button">
          <LuArrowUp aria-hidden="true" />
        </button>
      )}
    </>
  );
}
