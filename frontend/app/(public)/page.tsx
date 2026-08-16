"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import PublicFloatingActions from "../../components/layout/PublicFloatingActions";
import { siteConfig, whatsappLink } from "../../lib/site-config";

type IconName =
  | "arrow"
  | "cake"
  | "cart"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "heart"
  | "leaf"
  | "mail"
  | "menu"
  | "moon"
  | "phone"
  | "pin"
  | "search"
  | "send"
  | "sparkle"
  | "star"
  | "sun"
  | "truck"
  | "upload"
  | "user"

type Cake = {
  id: number;
  serverId?: string;
  slug?: string;
  name: string;
  category: string;
  tag: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  description: string;
  ingredients: string;
  allergens: string;
  flavors: string[];
  shapes: string[];
  variantPrices?: Record<string, number>;
};

type CartItem = {
  id: string;
  cake: Cake;
  quantity: number;
  size: string;
  flavor: string;
  shape: string;
  theme: string;
  message: string;
  toppings: string[];
  withCandles: boolean;
  withCard: boolean;
};

type CustomerDetails = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

type OrderDetails = {
  number: string;
  statusIndex: number;
  method: "delivery" | "pickup";
  dateLabel: string;
};

type CatalogueResponseCake = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  allergens: string | null;
  price: number;
  isFeatured: boolean;
  categories: Array<{ name: string; slug: string }>;
  images: Array<{ url: string | null; altText: string | null }>;
  variants: Array<{ id: string; name: string; price: number; isAvailable: boolean }>;
  customizations: Array<{ key: string; label: string; type: string; isRequired: boolean; priceDelta: number; values: Array<{ label: string; value: string; priceDelta: number }> }>;
};

type StoredCartItem = { id: string; quantity: number; variantId: string; variantName: string; cakeName: string; customizations: unknown };
type StoredCoupon = { code: string; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; value: number; maximumDiscount: number | null };
type StoredWishlistItem = { cakeId: string; cake: { name: string } };
type TrackedOrder = { status: string };

const imageBase = "https://images.unsplash.com/";

const orderStatuses: { label: string; note: string; icon: IconName }[] = [
  { label: "Order received", note: "Your order is confirmed", icon: "check" },
  { label: "Baking", note: "Freshly made in our studio", icon: "cake" },
  { label: "Decorating", note: "Adding the finishing touches", icon: "sparkle" },
  { label: "Out for delivery", note: "Carefully on its way to you", icon: "truck" },
  { label: "Delivered", note: "Time to celebrate", icon: "heart" },
];

const faqItems = [
  { question: "How far ahead should I order?", answer: "For custom designs, 3–5 days is best. A selection of cakes is available for next-day order." },
  { question: "Do you cater for dietary needs?", answer: "Yes. We have vegan and eggless choices, and can advise on ingredients before you order." },
  { question: "Can I change my delivery time?", answer: "Message us on WhatsApp as soon as you can. We will always try to make it work." },
  { question: "What areas do you deliver to?", answer: "We deliver across Nairobi, including Kilimani, Westlands, Karen, Lavington, Runda and nearby areas." },
];

const cakes: Cake[] = [
  {
    id: 1,
    name: "Strawberry Cloud",
    category: "Birthday",
    tag: "Bestseller",
    price: 4200,
    rating: 4.9,
    reviews: 86,
    image: `${imageBase}photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "A soft vanilla sponge layered with strawberry compote and clouds of mascarpone cream.",
    ingredients: "Wheat flour, free-range eggs, butter, milk, vanilla, strawberries.",
    allergens: "Contains wheat, dairy and eggs.",
    flavors: ["Vanilla berry", "Chocolate", "Lemon curd"],
    shapes: ["Round", "Heart", "Number"],
  },
  {
    id: 2,
    name: "Dark Cocoa Dream",
    category: "Chocolate",
    tag: "Rich & fudgy",
    price: 4600,
    rating: 4.8,
    reviews: 64,
    image: `${imageBase}photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1575377427642-087cf684f29d?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "Three layers of deep cocoa sponge, silky ganache and a little sea salt to finish.",
    ingredients: "Cocoa, wheat flour, butter, eggs, cream, dark chocolate, sea salt.",
    allergens: "Contains wheat, dairy and eggs.",
    flavors: ["Dark chocolate", "Mocha", "Salted caramel"],
    shapes: ["Round", "Square", "Heart"],
  },
  {
    id: 3,
    name: "Lemon Garden",
    category: "Anniversary",
    tag: "New season",
    price: 4400,
    rating: 5,
    reviews: 31,
    image: `${imageBase}photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "Bright lemon curd, tender sponge and rosemary cream — a garden party in every slice.",
    ingredients: "Wheat flour, eggs, butter, lemons, cream, rosemary, sugar.",
    allergens: "Contains wheat, dairy and eggs.",
    flavors: ["Lemon curd", "Vanilla berry", "Orange blossom"],
    shapes: ["Round", "Heart", "Square"],
  },
  {
    id: 4,
    name: "Pink Petal Party",
    category: "Baby shower",
    tag: "Made to order",
    price: 5000,
    rating: 4.9,
    reviews: 42,
    image: `${imageBase}photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1519869325930-281384150729?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "A celebration-ready vanilla cake with strawberry jam, piped petals and a soft blush finish.",
    ingredients: "Wheat flour, eggs, milk, butter, vanilla, strawberries, cream.",
    allergens: "Contains wheat, dairy and eggs.",
    flavors: ["Vanilla berry", "Chocolate", "Red velvet"],
    shapes: ["Round", "Heart", "Number"],
  },
  {
    id: 5,
    name: "Golden Hour",
    category: "Wedding",
    tag: "Elegant",
    price: 7200,
    rating: 4.9,
    reviews: 28,
    image: `${imageBase}photo-1519869325930-281384150729?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1519869325930-281384150729?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "A graceful two-tier cake with champagne buttercream, vanilla sponge and edible florals.",
    ingredients: "Wheat flour, eggs, butter, milk, vanilla, cream, edible flowers.",
    allergens: "Contains wheat, dairy and eggs.",
    flavors: ["Vanilla berry", "Lemon curd", "Almond praline"],
    shapes: ["Round", "Square"],
  },
  {
    id: 6,
    name: "Little Joys",
    category: "Kids",
    tag: "Crowd pleaser",
    price: 3800,
    rating: 4.8,
    reviews: 53,
    image: `${imageBase}photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "A joyful funfetti cake with vanilla buttercream, rainbow sprinkles and extra good vibes.",
    ingredients: "Wheat flour, eggs, milk, butter, vanilla, rainbow sprinkles.",
    allergens: "Contains wheat, dairy and eggs.",
    flavors: ["Vanilla berry", "Chocolate", "Funfetti"],
    shapes: ["Round", "Number", "Heart"],
  },
  {
    id: 7,
    name: "Coconut Fig",
    category: "Vegan / eggless",
    tag: "Plant based",
    price: 4800,
    rating: 4.7,
    reviews: 19,
    image: `${imageBase}photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "Moist coconut cake, fig preserve and a not-too-sweet oat cream for everyone at the table.",
    ingredients: "Coconut, wheat flour, oat milk, figs, vegetable oil, vanilla.",
    allergens: "Contains wheat and coconut. Made without eggs or dairy.",
    flavors: ["Coconut fig", "Lemon curd", "Dark chocolate"],
    shapes: ["Round", "Square", "Heart"],
  },
  {
    id: 8,
    name: "The Tiny Bloom",
    category: "Cupcakes",
    tag: "Box of 6",
    price: 2600,
    rating: 4.9,
    reviews: 74,
    image: `${imageBase}photo-1519869325930-281384150729?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1519869325930-281384150729?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1575377427642-087cf684f29d?auto=format&fit=crop&w=1000&q=85`,
    ],
    description:
      "Six little cakes for a big little moment, finished with vanilla swirls and seasonal blooms.",
    ingredients: "Wheat flour, eggs, milk, butter, vanilla, cream, seasonal fruit.",
    allergens: "Contains wheat, dairy and eggs.",
    flavors: ["Vanilla berry", "Chocolate", "Red velvet"],
    shapes: ["Round", "Heart"],
  },
];

const categories = [
  "All cakes",
  "Birthday",
  "Wedding",
  "Anniversary",
  "Graduation",
  "Baby shower",
  "Cupcakes",
  "Custom",
  "Kids",
  "Chocolate",
  "Vegan / eggless",
];

const categoryCards = [
  { name: "Birthdays", category: "Birthday", note: "Make a wish", image: cakes[0].image },
  { name: "Weddings", category: "Wedding", note: "For the forever kind", image: "/images/wedding%20cake.jpg" },
  { name: "Little ones", category: "Kids", note: "Big joy, tiny hands", image: cakes[5].image },
  { name: "Cupcakes", category: "Cupcakes", note: "Small but mighty", image: cakes[7].image },
];

const testimonials = [
  {
    quote: "It looked like a little piece of a garden party and tasted even better. The team made ordering feel so easy.",
    name: "Nia W.",
    detail: "Birthday celebration",
  },
  {
    quote: "Our wedding cake was gorgeous, calm and completely us. Every guest asked where it was from.",
    name: "Maya & Tom",
    detail: "Wedding cake",
  },
  {
    quote: "The chocolate cake disappeared before I could take a second photo. That says everything, honestly.",
    name: "Brian K.",
    detail: "Anniversary order",
  },
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
    cake: <><path d="M4 13h16v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M4 13c2 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 2 2 4 0" /><path d="M8 9a2 2 0 1 0 4 0c0-1.5-2-2-2-4-2 2-2 3-2 4Z" /><path d="M16 10a1.5 1.5 0 1 0 3 0c0-1-1.5-1.5-1.5-3-1.5 1.5-1.5 2-1.5 3Z" /></>,
    cart: <><path d="M3 4h2l2 11h10l3-8H6" /><path d="M9 19.5a1 1 0 1 0 0 .01" /><path d="M17 19.5a1 1 0 1 0 0 .01" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    heart: <path d="M20.8 8.7c0 5.5-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />,
    leaf: <><path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15Z" /><path d="M4 20c3-4 6-7 11-10" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
    phone: <path d="M6.5 3.5 9 3l2 4-2 1.5a14 14 0 0 0 6.5 6.5L17 13l4 2-.5 2.5A3 3 0 0 1 17.6 20C10 19.3 4.7 14 4 6.4A3 3 0 0 1 6.5 3.5Z" />,
    pin: <><path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.3" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></>,
    send: <><path d="m21 3-7 18-3.5-7.5L3 10Z" /><path d="M21 3 10.5 13.5" /></>,
    sparkle: <><path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2Z" /><path d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6Z" /></>,
    star: <path fill="currentColor" stroke="none" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />,
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    truck: <><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.7" /><circle cx="18" cy="18" r="1.7" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.4 3-5 7-5s6.3 1.6 7 5" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function formatPrice(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

function getCustomizedPrice(cake: Cake, size: string, toppings: string[], withCandles: boolean, withCard: boolean) {
  const normalizedSize = size.replace(/\s/g, "").toLowerCase();
  const serverVariantPrice = cake.variantPrices && Object.entries(cake.variantPrices).find(([name]) => name.replace(/\s/g, "").toLowerCase() === normalizedSize)?.[1];
  const basePrice = serverVariantPrice ?? cake.price * (size === "0.5 kg" ? 0.65 : size === "2 kg" ? 1.8 : 1);
  return Math.round(
    basePrice +
      (withCandles ? 250 : 0) +
      (withCard ? 350 : 0) +
      toppings.length * 180,
  );
}

function mapServerCake(cake: CatalogueResponseCake, fallback: Cake | undefined, index: number): Cake {
  const optionValues = (key: string, fallbackValues: string[]) => cake.customizations?.find((item) => item.key.toLowerCase() === key)?.values.map((value) => value.label) ?? fallback?.[key === "flavor" ? "flavors" : "shapes"] ?? fallbackValues;
  const images = cake.images.map((image) => image.url).filter((url): url is string => Boolean(url));
  const primaryImage = images[0] ?? fallback?.image ?? "/images/Bite%26Bloom%20icon.png";
  return {
    id: fallback?.id ?? index + 1,
    serverId: cake.id,
    slug: cake.slug,
    name: cake.name,
    category: cake.categories[0]?.name ?? fallback?.category ?? "Cake",
    tag: cake.isFeatured ? "Featured" : fallback?.tag ?? "Freshly baked",
    price: cake.price,
    rating: fallback?.rating ?? 0,
    reviews: fallback?.reviews ?? 0,
    image: primaryImage,
    images: images.length ? images : fallback?.images?.length ? fallback.images : [primaryImage],
    description: cake.description ?? fallback?.description ?? "Made fresh for your celebration.",
    ingredients: cake.ingredients ?? fallback?.ingredients ?? "Ask our team for ingredients.",
    allergens: cake.allergens ?? fallback?.allergens ?? "Please contact us about allergens.",
    flavors: optionValues("flavor", fallback?.flavors ?? ["Vanilla"]),
    shapes: optionValues("shape", fallback?.shapes ?? ["Round"]),
    variantPrices: Object.fromEntries(cake.variants.map((variant) => [variant.name, variant.price])),
  };
}

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All cakes");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [likedCakes, setLikedCakes] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "review">("details");
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<StoredCoupon | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CASH_ON_DELIVERY">("MPESA");
  const [scheduleMode, setScheduleMode] = useState<"next" | "schedule">("next");
  const [orderDate, setOrderDate] = useState("");
  const [orderTime, setOrderTime] = useState("10:00am – 12:00pm");
  const [customer, setCustomer] = useState<CustomerDetails>({ name: "", phone: "", email: "", address: "", notes: "" });
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [contactMessage, setContactMessage] = useState("");
  const [toast, setToast] = useState("");
  const [selectedSize, setSelectedSize] = useState("1 kg");
  const [selectedFlavor, setSelectedFlavor] = useState("Vanilla berry");
  const [selectedShape, setSelectedShape] = useState("Round");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("Whipped cream");
  const [toppings, setToppings] = useState<string[]>([]);
  const [withCandles, setWithCandles] = useState(false);
  const [withCard, setWithCard] = useState(false);
  const [catalogueCakes, setCatalogueCakes] = useState<Record<string, CatalogueResponseCake>>({});
  const { data: session, status: authStatus } = useSession();
  const signedIn = authStatus === "authenticated";
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const orderNumber = order?.number;
  const activeDialog = selectedCake ? "product" : checkoutOpen ? "checkout" : accountOpen ? "account" : cartOpen ? "cart" : null;

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bite-bloom-theme");
    const shouldUseDark = storedTheme ? storedTheme === "dark" : true;
    setDarkMode(shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/providers").then((response) => response.ok ? response.json() as Promise<Record<string, unknown>> : null).then((providers) => {
      if (isMounted) setGoogleAvailable(Boolean(providers?.google));
    }).catch(() => { if (isMounted) setGoogleAvailable(false); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!orderNumber || !customer.email) return;
    const controller = new AbortController();
    const statusIndex: Record<string, number> = { PENDING_PAYMENT: 0, PAID: 0, CONFIRMED: 0, PREPARING: 1, READY_FOR_DISPATCH: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4, COMPLETED: 4 };

    async function refreshTracking() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(customer.email)}`, { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { data?: TrackedOrder };
        if (payload.data?.status && statusIndex[payload.data.status] !== undefined) {
          setOrder((current) => current?.number === orderNumber ? { ...current, statusIndex: statusIndex[payload.data!.status] } : current);
        }
      } catch {
        // The confirmation view remains available if tracking cannot be refreshed.
      }
    }

    void refreshTracking();
    return () => controller.abort();
  }, [customer.email, orderNumber]);

  useEffect(() => {
    let isMounted = true;
    async function restoreCart() {
      try {
        const response = await fetch("/api/cart");
        if (!response.ok) return;
        const payload = await response.json() as { data?: { items?: StoredCartItem[]; coupons?: StoredCoupon[] } };
        if (!isMounted || !payload.data?.items) return;
        setAppliedCoupon(payload.data.coupons?.[0] ?? null);
        setCartItems(payload.data.items.flatMap((item) => {
          const fallbackCake = cakes.find((candidate) => candidate.name === item.cakeName);
          const cake = fallbackCake ?? (catalogueCakes[item.cakeName] ? mapServerCake(catalogueCakes[item.cakeName], undefined, cakes.length + 1) : undefined);
          if (!cake) return [];
          const options = item.customizations && typeof item.customizations === "object" ? item.customizations as Record<string, unknown> : {};
          return [{ id: item.id, cake, quantity: item.quantity, size: item.variantName, flavor: typeof options.flavor === "string" ? options.flavor : cake.flavors[0], shape: typeof options.shape === "string" ? options.shape : cake.shapes[0], theme: typeof options.theme === "string" ? options.theme : "Whipped cream", message: typeof options.message === "string" ? options.message : "", toppings: Array.isArray(options.toppings) ? options.toppings.filter((topping): topping is string => typeof topping === "string") : [], withCandles: options.withCandles === true, withCard: options.withCard === true }];
        }));
      } catch {
        // The cart drawer remains usable when the persistence service is offline.
      }
    }
    void restoreCart();
    return () => { isMounted = false; };
  }, [catalogueCakes]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("bite-bloom-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.body.style.overflow = selectedCake || cartOpen || checkoutOpen || accountOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCake, cartOpen, checkoutOpen, accountOpen]);

  useEffect(() => {
    if (!activeDialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>("[role=\"dialog\"][aria-modal=\"true\"]");
    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = dialog?.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex=\"-1\"])");
      firstFocusable?.focus({ preventScroll: true });
    });
    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeDialog === "product") setSelectedCake(null);
        else if (activeDialog === "checkout") setCheckoutOpen(false);
        else if (activeDialog === "account") setAccountOpen(false);
        else if (activeDialog === "cart") setCartOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex=\"-1\"])")).filter((element) => !element.hasAttribute("aria-hidden"));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleDialogKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [activeDialog]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalogue() {
      try {
        const response = await fetch("/api/cakes", { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { data?: { items?: CatalogueResponseCake[] } };
        const items = payload.data?.items ?? [];
        setCatalogueCakes(Object.fromEntries(items.map((cake) => [cake.name, cake])));
      } catch {
        // The static visual catalogue remains available while the API is offline.
      }
    }

    void loadCatalogue();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (Object.keys(catalogueCakes).length === 0) return;
    const controller = new AbortController();
    async function restoreWishlist() {
      try {
        const response = await fetch("/api/account/wishlist", { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { data?: StoredWishlistItem[] };
        if (!payload.data) return;
        setLikedCakes(payload.data.flatMap((item, index) => {
          const cake = cakes.find((candidate) => candidate.name === item.cake.name) ?? (catalogueCakes[item.cake.name] ? mapServerCake(catalogueCakes[item.cake.name], undefined, index) : undefined);
          return cake ? [cake.id] : [];
        }));
      } catch {
        // Visitors can still browse cakes without an account wishlist.
      }
    }
    void restoreWishlist();
    return () => controller.abort();
  }, [catalogueCakes]);

  const displayedCakes = useMemo(() => {
    const serverCakes = Object.values(catalogueCakes);
    if (!serverCakes.length) return cakes;
    return serverCakes.map((serverCake, index) => mapServerCake(serverCake, cakes.find((cake) => cake.name === serverCake.name), index));
  }, [catalogueCakes]);

  const filteredCakes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = displayedCakes.filter((cake) => {
      const matchesCategory = activeCategory === "All cakes" || cake.category === activeCategory;
      const matchesSearch = !query || `${cake.name} ${cake.category} ${cake.tag}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviews - a.reviews;
    });
  }, [activeCategory, displayedCakes, search, sortBy]);

  const customizationPrice = selectedCake ? getCustomizedPrice(selectedCake, selectedSize, toppings, withCandles, withCard) : 0;
  const cartSubtotal = cartItems.reduce(
    (total, item) => total + getCustomizedPrice(item.cake, item.size, item.toppings, item.withCandles, item.withCard) * item.quantity,
    0,
  );
  const couponDiscount = !appliedCoupon ? 0 : Math.min(cartSubtotal, Math.round(appliedCoupon.maximumDiscount === null ? (appliedCoupon.discountType === "PERCENTAGE" ? cartSubtotal * (appliedCoupon.value / 100) : appliedCoupon.value) : Math.min(appliedCoupon.discountType === "PERCENTAGE" ? cartSubtotal * (appliedCoupon.value / 100) : appliedCoupon.value, appliedCoupon.maximumDiscount)));
  const deliveryFee = deliveryMethod === "delivery" && cartItems.length ? (cartSubtotal >= 6000 ? 0 : 350) : 0;
  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - couponDiscount);

  function toggleDarkMode() {
    setDarkMode((current) => !current);
  }

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(""), 3200);
  }

  function openCake(cake: Cake) {
    setSelectedCake(cake);
    setActiveImage(0);
    setSelectedSize("1 kg");
    setSelectedFlavor(cake.flavors[0]);
    setSelectedShape(cake.shapes[0]);
    setMessage("");
    setTheme("Whipped cream");
    setToppings([]);
    setWithCandles(false);
    setWithCard(false);
  }

  async function addToCart() {
    if (!selectedCake) return;
    const newItem: CartItem = {
      id: `${selectedCake.id}-${Date.now()}`,
      cake: selectedCake,
      quantity: 1,
      size: selectedSize,
      flavor: selectedFlavor,
      shape: selectedShape,
      theme,
      message,
      toppings,
      withCandles,
      withCard,
    };
    setCartItems((items) => [...items, newItem]);
    const serverCake = catalogueCakes[selectedCake.name];
    const variant = serverCake?.variants.find((item) => item.name === selectedSize);
    if (variant) {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.id, quantity: 1, customizations: { flavor: selectedFlavor, shape: selectedShape, theme, message, toppings, withCandles, withCard } }),
      }).catch(() => null);
      if (response?.ok) {
        const payload = await response.json() as { data?: { items?: StoredCartItem[] } };
        const storedItem = payload.data?.items?.filter((item) => item.variantId === variant.id).at(-1);
        if (storedItem) setCartItems((items) => items.map((item) => item.id === newItem.id ? { ...item, id: storedItem.id } : item));
      }
    }
    setSelectedCake(null);
    setCartOpen(true);
    showToast(`${selectedCake.name} is in your cart`);
  }

  function updateQuantity(id: string, change: number) {
    setCartItems((items) => items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item));
    const item = cartItems.find((candidate) => candidate.id === id);
    if (item) void fetch(`/api/cart/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: Math.max(1, item.quantity + change) }) });
  }

  function removeCartItem(id: string) {
    setCartItems((items) => items.filter((item) => item.id !== id));
    void fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    showToast("Item removed from your cart");
  }

  function saveCartItem(item: CartItem) {
    setSavedItems((items) => [...items, item]);
    setCartItems((items) => items.filter((current) => current.id !== item.id));
    void fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
    showToast(`${item.cake.name} saved for later`);
  }

  function moveSavedToCart(item: CartItem) {
    setCartItems((items) => [...items, item]);
    setSavedItems((items) => items.filter((current) => current.id !== item.id));
    showToast(`${item.cake.name} moved back to your cart`);
  }

  async function toggleWishlist(cake: Cake) {
    const serverCake = catalogueCakes[cake.name];
    if (!serverCake) return showToast("This cake is not available to save yet");
    const wasLiked = likedCakes.includes(cake.id);
    setLikedCakes((current) => wasLiked ? current.filter((id) => id !== cake.id) : [...current, cake.id]);
    const response = await fetch(wasLiked ? `/api/account/wishlist/${encodeURIComponent(serverCake.id)}` : "/api/account/wishlist", {
      method: wasLiked ? "DELETE" : "POST",
      headers: wasLiked ? undefined : { "Content-Type": "application/json" },
      ...(wasLiked ? {} : { body: JSON.stringify({ cakeId: serverCake.id }) }),
    }).catch(() => null);
    if (!response?.ok) {
      setLikedCakes((current) => wasLiked ? [...current, cake.id] : current.filter((id) => id !== cake.id));
      showToast(response?.status === 401 ? "Sign in to save your favorite cakes" : "Unable to update your wishlist right now");
      return;
    }
    showToast(wasLiked ? `${cake.name} removed from favorites` : `${cake.name} saved to favorites`);
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return showToast("Enter a coupon code first");
    const response = await fetch("/api/cart/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { data?: { coupons?: StoredCoupon[] }; error?: { message?: string } } | null;
    if (!response?.ok) return showToast(payload?.error?.message ?? "Unable to apply that coupon right now");
    const coupon = payload?.data?.coupons?.[0] ?? null;
    setAppliedCoupon(coupon);
    setCouponCode("");
    showToast(coupon ? `${coupon.code} applied — a little more joy for less` : "Coupon applied");
  }

  function openCheckout() {
    if (!cartItems.length) {
      showToast("Add a cake before checking out");
      return;
    }
    setCartOpen(false);
    setCheckoutStep("details");
    setCheckoutOpen(true);
  }

  function reviewCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer.name || !customer.phone || !customer.email || (deliveryMethod === "delivery" && !customer.address)) {
      showToast("Please fill in your customer and delivery details");
      return;
    }
    if (scheduleMode === "schedule" && !orderDate) {
      showToast("Choose a date for your future order");
      return;
    }
    const useMpesa = window.confirm("Choose payment method:\n\nOK — Pay by M-Pesa on your phone\nCancel — Pay cash on delivery");
    setPaymentMethod(useMpesa ? "MPESA" : "CASH_ON_DELIVERY");
    setCheckoutStep("review");
  }

  function whatsappOrderLink(orderNumber: string): string {
    const summary = cartItems.map((item) => `${item.quantity} × ${item.cake.name} (${item.size})`).join(", ");
    const message = `Hi Bite & Bloom, I placed Cash on Delivery order ${orderNumber}.\n\nItems: ${summary}\nTotal: ${formatPrice(cartTotal)}\nDelivery: ${deliveryMethod === "delivery" ? customer.address : "Studio pickup"}\nCustomer: ${customer.name} · ${customer.phone}`;
    return whatsappLink(message);
  }

  async function placeOrder() {
    const whatsappWindow = paymentMethod === "CASH_ON_DELIVERY" ? window.open("", "_blank") : null;
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: customer.name, email: customer.email, phone: customer.phone, fulfillmentType: deliveryMethod === "delivery" ? "DELIVERY" : "PICKUP", paymentMethod, address: customer.address, notes: customer.notes }),
      }).catch(() => null);
    if (!response?.ok) {
      whatsappWindow?.close();
      showToast("We could not place your order. Please check your cart and try again.");
      return;
    }
    const payload = await response.json() as { data?: { orderNumber: string; paymentInitiated?: boolean; paymentMethod?: "MPESA" | "CASH_ON_DELIVERY"; paymentMessage?: string } };
    if (!payload.data?.orderNumber) {
      whatsappWindow?.close();
      showToast("We could not confirm your order. Please try again.");
      return;
    }
    if (payload.data.paymentMethod === "CASH_ON_DELIVERY" && whatsappWindow) whatsappWindow.location.href = whatsappOrderLink(payload.data.orderNumber);
    else whatsappWindow?.close();
    const dateLabel = scheduleMode === "schedule" && orderDate ? `${orderDate} · ${orderTime}` : deliveryMethod === "delivery" ? "Tomorrow · 10:00am – 12:00pm" : "Tomorrow · collection after 10:00am";
    setOrder({ number: payload.data.orderNumber, statusIndex: 0, method: deliveryMethod, dateLabel });
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponCode("");
    setCheckoutOpen(false);
    setCheckoutStep("details");
    showToast(payload.data.paymentInitiated ? (payload.data.paymentMessage ?? "Check your phone to complete M-Pesa payment.") : (payload.data.paymentMessage ?? `Order ${payload.data.orderNumber} received — thank you`));
    window.setTimeout(() => document.getElementById("order-tracking")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authEmail || !authPassword) {
      showToast("Enter your email and password to continue");
      return;
    }
    setAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: customer.name || "Cake lover", email: authEmail, password: authPassword }) });
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        if (!response.ok) { showToast(payload?.error?.message ?? "Unable to create your account"); return; }
        setAccountOpen(false);
        showToast("Account created. Check your email to verify it before signing in.");
        return;
      }
      const result = await signIn("credentials", { email: authEmail, password: authPassword, redirect: false });
      if (result?.error) { showToast("Your email or password is incorrect, or the account is not active"); return; }
      setAccountOpen(false);
      showToast(authMode === "signin" ? "Welcome back to Bite & Bloom" : "Your sweet account is ready");
    } catch {
      showToast("Authentication is temporarily unavailable");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = event.currentTarget.querySelectorAll<HTMLInputElement>("input");
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fields[0]?.value, email: fields[1]?.value, message: contactMessage }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { error?: { message?: string } } | null;
    if (!response?.ok) {
      showToast(payload?.error?.message ?? "We could not send your message right now");
      return;
    }
    event.currentTarget.reset();
    setContactMessage("");
    showToast("Message sent — we will be in touch shortly");
  }

  async function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, consent: true }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { error?: { message?: string } } | null;
    if (!response?.ok) {
      showToast(payload?.error?.message ?? "We could not add you to the sweet list right now");
      return;
    }
    event.currentTarget.reset();
    showToast("You are on the sweet list ✦");
  }

  function scrollToCollection() {
    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  function toggleTopping(topping: string) {
    setToppings((current) =>
      current.includes(topping) ? current.filter((item) => item !== topping) : [...current, topping],
    );
  }

  const minOrderDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const whatsappMessage = order ? `Hi Bite & Bloom, I would like an update on order ${order.number}.` : "Hi Bite & Bloom, I would love help choosing a cake.";
  return (
    <div className="site-shell">
      <div className="topline">
        <div className="container topline-inner">
          <span><Icon name="sparkle" size={14} /> Freshly baked, thoughtfully delivered across Nairobi</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container nav-wrap">
          <a href="#top" className="brand" aria-label="Bite and Bloom home">
            <span className="brand-mark"><Image className="brand-logo" src="/images/Bite%26Bloom%20icon.png" alt="" width={48} height={48} priority /></span>
            <span><strong className="brand-wordmark">BITE <i>&</i> BLOOM</strong><small>CAKE STUDIO</small></span>
          </a>
          <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            <a href="/cakes" onClick={() => setMenuOpen(false)}>Shop cakes</a>
            <a href="#occasions" onClick={() => setMenuOpen(false)}>Occasions</a>
            <a href="#our-story" onClick={() => setMenuOpen(false)}>Our story</a>
            <a href="#delivery" onClick={() => setMenuOpen(false)}>Delivery</a>
          </nav>
          <div className="nav-actions">
            <button className="icon-button" onClick={() => document.getElementById("cake-search")?.focus()} aria-label="Search cakes"><Icon name="search" /></button>
            <button className="icon-button theme-toggle" onClick={toggleDarkMode} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon name={darkMode ? "sun" : "moon"} size={19} />
            </button>
            <button className="icon-button account-button" onClick={() => setAccountOpen(true)} aria-label={signedIn ? "Open account" : "Sign in"}><span className="account-dot">{signedIn ? "B" : ""}</span><Icon name="user" size={18} /></button>
            <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Open cart">
              <Icon name="cart" size={19} /><span className="cart-label">Cart</span><b>{cartCount}</b>
            </button>
            <button className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}><Icon name={menuOpen ? "close" : "menu"} /></button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy fade-up">
              <p className="eyebrow"><span className="eyebrow-line" /> Cake for the beautiful in-between</p>
              <h1>Make a little <em>room</em> for joy.</h1>
              <p className="hero-lede">Hand-finished cakes for birthdays, big days and the tiny reasons worth celebrating. Baked fresh in Nairobi, delivered with care.</p>
              <div className="hero-actions">
                <button className="button button-dark" onClick={scrollToCollection}>Explore the cakes <Icon name="arrow" size={17} /></button>
                <a className="text-link" href="#our-story">Our ingredients <span>↗</span></a>
              </div>
              <div className="hero-trust">
                <div className="avatar-stack"><span>NW</span><span>MT</span><span>BK</span><span>+</span></div>
                <div><div className="stars"><Icon name="star" size={14} /><Icon name="star" size={14} /><Icon name="star" size={14} /><Icon name="star" size={14} /><Icon name="star" size={14} /></div><small>Loved by 2,000+ cake people</small></div>
              </div>
            </div>
            <div className="hero-art fade-in">
              <div className="hero-image-main image-sheen"><img src={displayedCakes[0].image} alt="Strawberry cake with fresh flowers" /></div>
              <div className="hero-image-small image-sheen"><img src={displayedCakes[2].image} alt="Lemon cake slice" /></div>
              <div className="hero-note glass-card"><span className="note-stamp">01</span><strong>Sweet things,<br />made slowly.</strong><small>Since 2018 · Nairobi</small></div>
              <div className="hero-float">Baked with <span>♡</span><br />in every layer</div>
              <div className="hero-sun" />
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="Bite and Bloom values">
          <div className="ticker-track"><span>Made to order</span><b>✦</b><span>Seasonal ingredients</span><b>✦</b><span>Delivery across Nairobi</span><b>✦</b><span>Made to order</span><b>✦</b><span>Seasonal ingredients</span><b>✦</b><span>Delivery across Nairobi</span></div>
        </div>

        {order && <section className="order-tracking-section" id="order-tracking"><div className="container"><div className="tracking-header"><div><p className="eyebrow">Your cake is on its way</p><h2>Order <em>{order.number}</em></h2><p>Expected {order.dateLabel} · {order.method === "delivery" ? "Home delivery" : "Pickup from Kilimani studio"}</p></div><a className="whatsapp-button" href={whatsappLink(whatsappMessage)} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> WhatsApp support</a></div><div className="tracking-line">{orderStatuses.map((status, index) => <div className={`tracking-step ${index <= order.statusIndex ? "complete" : ""} ${index === order.statusIndex ? "current" : ""}`} key={status.label}><span className="tracking-icon"><Icon name={status.icon} size={17} /></span><div><strong>{status.label}</strong><p>{status.note}</p></div></div>)}</div><div className="tracking-footer"><span><Icon name="clock" size={16} /> Status refreshes from your order record</span><a className="text-link" href="/tracking">Open full tracking <Icon name="arrow" size={14} /></a></div></div></section>}

        <section className="section section-light" id="occasions">
          <div className="container">
            <div className="section-heading heading-row">
              <div><p className="eyebrow">Find your occasion</p><h2>A cake for every <em>kind</em> of happy.</h2></div>
              <button className="round-arrow" onClick={scrollToCollection} aria-label="Browse all cakes"><Icon name="arrow" size={20} /></button>
            </div>
            <div className="category-grid">
              {categoryCards.map((category, index) => (
                <button key={category.name} className={`category-card category-card-${index + 1}`} onClick={() => { setActiveCategory(category.category); scrollToCollection(); }}>
                  <img src={category.image} alt={`${category.name} cake collection`} />
                  <span className="category-shade" />
                  <span className="category-card-content"><small>{category.note}</small><strong>{category.name}</strong><span className="category-link">Explore <Icon name="arrow" size={15} /></span></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section collection-section" id="collection">
          <div className="container">
            <div className="section-heading collection-heading">
              <div><p className="eyebrow">The cake counter</p><h2>Meet the <em>sweet</em> spot.</h2><p className="section-intro">Pick a favorite or make it entirely your own. Every cake is finished by hand, just for you.</p></div>
              <span className="counter-count">{filteredCakes.length.toString().padStart(2, "0")} cakes</span>
            </div>
            <div className="catalog-toolbar">
              <label className="search-field" htmlFor="cake-search"><Icon name="search" size={18} /><span className="sr-only">Search cakes</span><input id="cake-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cakes, flavors, occasions..." /></label>
              <div className="sort-field"><span>Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort cakes"><option value="popular">Most loved</option><option value="rating">Highest rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><Icon name="chevron" size={15} /></div>
            </div>
            <div className="category-filters" role="tablist" aria-label="Cake categories">
              {categories.map((category) => <button key={category} role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}
            </div>
            {filteredCakes.length ? <div className="cake-grid">{filteredCakes.map((cake, index) => (
              <article className="cake-card" key={cake.id} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}>
                <div className="cake-image-wrap" onClick={() => openCake(cake)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openCake(cake); }}>
                  <img src={cake.image} alt={cake.name} loading="lazy" />
                  <span className="cake-tag">{cake.tag}</span>
                  <button className={`heart-button ${likedCakes.includes(cake.id) ? "liked" : ""}`} onClick={(event) => { event.stopPropagation(); void toggleWishlist(cake); }} aria-label={likedCakes.includes(cake.id) ? `Remove ${cake.name} from favorites` : `Add ${cake.name} to favorites`}><Icon name="heart" size={18} /></button>
                  <span className="quick-view">Quick view <Icon name="arrow" size={14} /></span>
                </div>
                <div className="cake-card-body"><div className="cake-meta"><span>{cake.category}</span><span><Icon name="star" size={12} /> {cake.rating} ({cake.reviews})</span></div><h3>{cake.name}</h3><div className="cake-price-row"><strong>{formatPrice(cake.price)}</strong><button onClick={() => openCake(cake)}>Customize <Icon name="arrow" size={14} /></button></div></div>
              </article>
            ))}</div> : <div className="empty-results"><Icon name="cake" size={30} /><h3>Nothing in the oven yet.</h3><p>Try another search or browse all of our cakes.</p><button className="button button-outline" onClick={() => { setSearch(""); setActiveCategory("All cakes"); }}>Reset filters</button></div>}
            <div className="collection-footnote"><span><Icon name="leaf" size={16} /> Vegetarian-friendly options available</span><span><Icon name="clock" size={16} /> Order by 12pm for next-day delivery</span><span><Icon name="truck" size={16} /> Delivery from KSh 300</span></div>
          </div>
        </section>

        <section className="section promise-section" id="our-story">
          <div className="container promise-grid">
            <div className="promise-copy"><p className="eyebrow">A softer way to celebrate</p><h2>Good cake starts with <em>good</em> things.</h2><p>We believe the best cakes feel a little personal. That means real butter, seasonal fruit, gentle sweetness and the freedom to add your own story to every order.</p><a className="text-link" href="#delivery">A little more about us <span>↗</span></a></div>
            <div className="promise-list"><div className="promise-item"><span className="promise-icon"><Icon name="leaf" size={21} /></span><div><strong>Thoughtful ingredients</strong><p>Small-batch, seasonal and always chosen with care.</p></div></div><div className="promise-item"><span className="promise-icon"><Icon name="sparkle" size={21} /></span><div><strong>Hand-finished details</strong><p>Little piping, big feeling. No two are exactly alike.</p></div></div><div className="promise-item"><span className="promise-icon"><Icon name="truck" size={21} /></span><div><strong>Delivered gently</strong><p>From our oven to your door, right on time.</p></div></div></div>
          </div>
        </section>

        <section className="section promo-section">
          <div className="container promo-grid"><div className="promo-card promo-main"><div><p className="eyebrow">For the last-minute lovers</p><h2>Tomorrow tastes<br /><em>this good.</em></h2><p>Order by noon for next-day delivery in Nairobi.</p><button className="button button-light" onClick={scrollToCollection}>Shop ready-to-love <Icon name="arrow" size={17} /></button></div><div className="promo-image"><img src={displayedCakes[3].image} alt="Pink cake with flowers" /></div></div><div className="promo-card promo-side"><span className="promo-side-icon"><Icon name="cake" size={28} /></span><p className="eyebrow">Make it yours</p><h3>Your cake,<br /><em>your story.</em></h3><p>Add a message, colors, toppings and all the tiny things that make it feel like you.</p><button className="button button-dark full-button" onClick={() => openCake(displayedCakes[0])}>Start customizing <Icon name="arrow" size={16} /></button></div></div>
        </section>

        <section className="section testimonials-section">
          <div className="container"><div className="section-heading heading-row"><div><p className="eyebrow">From the cake people</p><h2>Words we <em>keep</em> close.</h2></div><div className="quote-mark">“</div></div><div className="testimonial-grid">{testimonials.map((testimonial) => <figure className="testimonial-card" key={testimonial.name}><div className="testimonial-stars"><Icon name="star" size={13} /><Icon name="star" size={13} /><Icon name="star" size={13} /><Icon name="star" size={13} /><Icon name="star" size={13} /></div><blockquote>“{testimonial.quote}”</blockquote><figcaption><span className="review-avatar">{testimonial.name.split(" ").map((part) => part[0]).join("")}</span><span><strong>{testimonial.name}</strong><small>{testimonial.detail}</small></span></figcaption></figure>)}</div></div>
        </section>

        <section className="delivery-section" id="delivery"><div className="container delivery-grid"><div className="delivery-copy"><p className="eyebrow">Come on over, or stay cosy</p><h2>We bring the good stuff <em>to you.</em></h2><p>We deliver Monday to Saturday across Nairobi, with careful timing and an extra layer of protection for your cake.</p><div className="delivery-detail"><Icon name="pin" size={20} /><span><strong>Where we deliver</strong><small>Kilimani · Lavington · Westlands · Karen · Kileleshwa<br />CBD · Parklands · Runda · Gigiri and nearby areas</small></span></div><div className="delivery-detail"><Icon name="clock" size={20} /><span><strong>When we bake</strong><small>Mon–Sat, 8:00am–6:00pm<br />Same-day collection from our Kilimani studio</small></span></div></div><div className="contact-card glass-card"><span className="contact-script">Let&apos;s make it sweet</span><h3>Have something<br /><em>in mind?</em></h3><p>Tell us what you&apos;re dreaming up. We&apos;ll help you make it real.</p><a href={`mailto:${siteConfig.email}`} className="contact-line"><Icon name="mail" size={17} /> {siteConfig.email}</a><a href={`tel:${siteConfig.phoneHref}`} className="contact-line"><Icon name="phone" size={17} /> {siteConfig.phoneDisplay}</a><a className="whatsapp-contact" href={whatsappLink(whatsappMessage)} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> Chat on WhatsApp</a><a className="button button-dark full-button" href={`mailto:${siteConfig.email}?subject=Custom%20cake%20enquiry`}>Start a conversation <Icon name="send" size={16} /></a></div></div></section>
      </main>

      <section className="support-section" id="contact"><div className="container"><div className="section-heading support-heading"><div><p className="eyebrow">Say hello</p><h2>We&apos;re here for the <em>sweet questions.</em></h2><p className="section-intro">Order help, custom cake ideas, delivery questions or just a little cake chat — we&apos;d love to hear from you.</p></div><span className="support-hours"><strong>Mon–Sat</strong><small>8:00am – 6:00pm</small></span></div><div className="support-grid"><form className="contact-form-card" onSubmit={handleContactSubmit}><div className="form-card-heading"><span className="support-icon"><Icon name="mail" size={19} /></span><div><strong>Send us a note</strong><small>We usually reply within a few hours.</small></div></div><div className="form-row"><label><span>Your name</span><input required placeholder="Amina Otieno" /></label><label><span>Email address</span><input required type="email" placeholder="hello@example.com" /></label></div><label><span>How can we help?</span><textarea required value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} placeholder="Tell us what you&apos;re dreaming up..." /></label><button className="button button-dark" type="submit">Send message <Icon name="send" size={15} /></button><div className="direct-contact"><a href={siteConfig.phoneHref}><Icon name="phone" size={15} /> Call us</a><a href={whatsappLink("Hi Bite & Bloom, I have a question.")} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> WhatsApp</a></div></form><div className="map-card"><div className="map-heading"><div><strong>Our little corner</strong><small>{siteConfig.address}</small></div><a href={siteConfig.mapSearchUrl} target="_blank" rel="noreferrer" aria-label="Open Bite and Bloom location in Google Maps"><Icon name="arrow" size={16} /></a></div><div className="map-frame"><iframe title="Bite and Bloom location map" loading="lazy" src={siteConfig.mapEmbedUrl} /></div><div className="map-address"><Icon name="pin" size={16} /><span><strong>Studio collection</strong><small>{siteConfig.address}</small></span></div></div><div className="faq-card"><div className="form-card-heading"><span className="support-icon"><Icon name="sparkle" size={19} /></span><div><strong>Frequently asked</strong><small>Good things to know before you order.</small></div></div><div className="faq-list">{faqItems.map((faq, index) => <div className={`faq-item ${faqOpen === index ? "open" : ""}`} key={faq.question}><button onClick={() => setFaqOpen(faqOpen === index ? null : index)} aria-expanded={faqOpen === index}>{faq.question}<span>{faqOpen === index ? "−" : "+"}</span></button>{faqOpen === index && <p>{faq.answer}</p>}</div>)}</div><a className="text-link" href={whatsappLink("Hi Bite & Bloom, I have a question.")} target="_blank" rel="noreferrer">Ask us on WhatsApp <span>↗</span></a></div></div></div></section>

      <footer className="site-footer"><div className="container footer-top"><div className="footer-brand"><a href="#top" className="brand"><span className="brand-mark"><Icon name="cake" size={24} /></span><span><strong>BITE <i>&</i> BLOOM</strong><small>CAKE STUDIO</small></span></a><p>A little more joy, one slice at a time.</p><div className="social-links"><a href={siteConfig.social.instagram} aria-label="Instagram" target="_blank" rel="noreferrer"><FaInstagram aria-hidden="true" /></a><a href={siteConfig.social.facebook} aria-label="Facebook" target="_blank" rel="noreferrer"><FaFacebookF aria-hidden="true" /></a><a href={siteConfig.social.tiktok} aria-label="TikTok" target="_blank" rel="noreferrer"><FaTiktok aria-hidden="true" /></a></div></div><div className="footer-column"><strong>Explore</strong><a href="/cakes">Shop cakes</a><a href="#occasions">Occasions</a><a href="#our-story">Our story</a></div><div className="footer-column"><strong>Need to know</strong><a href="#delivery">Delivery areas</a><a href="#contact">FAQs</a><a href="#contact">Contact us</a></div><div className="newsletter"><strong>Get the good stuff</strong><p>Seasonal menus, early drops and a little sweetness in your inbox.</p><form onSubmit={handleNewsletterSubmit}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" required placeholder="Your email address" /><button type="submit" aria-label="Subscribe"><Icon name="arrow" size={17} /></button></form></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Bite & Bloom. Made with care in Nairobi.</span><span><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/cookies">Cookies</a> · <a href="/unsubscribe">Unsubscribe</a> · <a href="#top">Back to top ↑</a></span></div></footer>

      {cartOpen && <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="drawer-header"><div><p className="eyebrow">Your sweet selection</p><h2 id="cart-title">Your cart <em>({cartCount})</em></h2></div><button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Close cart"><Icon name="close" size={19} /></button></div>{cartItems.length ? <><div className="drawer-items">{cartItems.map((item) => <div className="drawer-item" key={item.id}><img src={item.cake.image} alt={item.cake.name} /><div className="drawer-item-info"><div className="drawer-item-title"><strong>{item.cake.name}</strong><button onClick={() => removeCartItem(item.id)} aria-label={`Remove ${item.cake.name}`}>&times;</button></div><small>{item.size} · {item.flavor} · {item.shape}</small><small>{item.message ? `Message: “${item.message}”` : item.theme}</small><div className="drawer-item-bottom"><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity">−</button><b>{item.quantity}</b><button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity">+</button></div><strong>{formatPrice(getCustomizedPrice(item.cake, item.size, item.toppings, item.withCandles, item.withCard) * item.quantity)}</strong></div><button className="save-button" onClick={() => saveCartItem(item)}>♡ Save for later</button></div></div>)}</div>{savedItems.length > 0 && <div className="saved-items"><div className="drawer-subheading"><strong>Saved for later</strong><span>{savedItems.length} item{savedItems.length > 1 ? "s" : ""}</span></div>{savedItems.map((item) => <div className="saved-item" key={item.id}><span>{item.cake.name}</span><button onClick={() => moveSavedToCart(item)}>Move to cart</button></div>)}</div>}<form className="coupon-form" onSubmit={applyCoupon}><label htmlFor="coupon-code">Have a code?</label><div><input id="coupon-code" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="SWEET10" /><button type="submit">Apply</button></div>{appliedCoupon && <small>{appliedCoupon.code} applied · {couponDiscount ? `${formatPrice(couponDiscount)} saved` : "discount added"}</small>}</form><div className="cart-summary"><div><span>Subtotal</span><strong>{formatPrice(cartSubtotal)}</strong></div><div><span>Delivery fee <small>{deliveryMethod === "pickup" ? "(pickup)" : cartSubtotal >= 6000 ? "(free over KSh 6,000)" : "(Nairobi)"}</small></span><strong>{deliveryFee ? formatPrice(deliveryFee) : "Free"}</strong></div>{couponDiscount > 0 && <div className="discount-row"><span>Discount</span><strong>− {formatPrice(couponDiscount)}</strong></div>}<div className="estimated-total"><span>Estimated total</span><strong>{formatPrice(cartTotal)}</strong></div></div><button className="button button-dark checkout-button" onClick={openCheckout}>Continue to checkout <Icon name="arrow" size={16} /></button><p className="secure-note"><Icon name="check" size={13} /> You can choose delivery or pickup at checkout</p></> : <div className="empty-cart"><span className="empty-cart-icon"><Icon name="cake" size={29} /></span><h3>Your cart is feeling light.</h3><p>Choose something lovely and we&apos;ll keep it safe here.</p><button className="button button-dark" onClick={() => { setCartOpen(false); scrollToCollection(); }}>Browse cakes <Icon name="arrow" size={15} /></button>{savedItems.length > 0 && <div className="saved-empty"><strong>Saved for later · {savedItems.length}</strong>{savedItems.map((item) => <button key={item.id} onClick={() => moveSavedToCart(item)}>{item.cake.name} <span>Move to cart →</span></button>)}</div>}</div>}</aside></div>}

      {checkoutOpen && <div className="modal-backdrop checkout-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}><div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><Icon name="close" size={20} /></button><div className="checkout-main"><div className="checkout-topline"><span>Checkout · {checkoutStep === "details" ? "1 of 2" : "2 of 2"}</span><div><b className={checkoutStep === "details" ? "active" : "done"}>1</b><i /><b className={checkoutStep === "review" ? "active" : ""}>2</b></div></div>{checkoutStep === "details" ? <form onSubmit={reviewCheckout}><h2 id="checkout-title">Let&apos;s get you <em>sorted.</em></h2><p className="checkout-intro">A few details, then we&apos;ll take care of the rest.</p><div className="checkout-section"><div className="checkout-section-heading"><strong>Your details</strong><span>Required</span></div><div className="form-row"><label><span>Full name</span><input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="Amina Otieno" /></label><label><span>Phone number</span><input required type="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="0711 222 333" /></label></div><label><span>Email address</span><input required type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="amina@example.com" /></label></div><div className="checkout-section"><div className="checkout-section-heading"><strong>How would you like it?</strong><span>Choose one</span></div><div className="delivery-choice-grid"><button type="button" className={deliveryMethod === "delivery" ? "selected" : ""} onClick={() => setDeliveryMethod("delivery")}><Icon name="truck" size={19} /><span><strong>Home delivery</strong><small>From KSh 300 · Nairobi</small></span></button><button type="button" className={deliveryMethod === "pickup" ? "selected" : ""} onClick={() => setDeliveryMethod("pickup")}><Icon name="pin" size={19} /><span><strong>Pick up from shop</strong><small>13 Riverside Lane, Kilimani</small></span></button></div>{deliveryMethod === "delivery" ? <label><span>Delivery address</span><input required value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} placeholder="Building, street and area" /></label> : <div className="pickup-note"><Icon name="pin" size={17} /><span><strong>Studio collection</strong><small>13 Riverside Lane, Kilimani · We&apos;ll have it ready for you.</small></span></div>}</div><div className="checkout-section"><div className="checkout-section-heading"><strong>When should we make it?</strong><span>Plan ahead</span></div><div className="schedule-choice"><label className={scheduleMode === "next" ? "selected" : ""}><input type="radio" checked={scheduleMode === "next"} onChange={() => setScheduleMode("next")} />{deliveryMethod === "delivery" ? "Next available · Tomorrow" : "Next available · Tomorrow"}<small>{deliveryMethod === "delivery" ? "10:00am – 12:00pm" : "Collection after 10:00am"}</small></label><label className={scheduleMode === "schedule" ? "selected" : ""}><input type="radio" checked={scheduleMode === "schedule"} onChange={() => setScheduleMode("schedule")} />Schedule a future order{scheduleMode === "schedule" && <><input type="date" min={minOrderDate} value={orderDate} onChange={(event) => setOrderDate(event.target.value)} /><select value={orderTime} onChange={(event) => setOrderTime(event.target.value)}><option>10:00am – 12:00pm</option><option>12:00pm – 2:00pm</option><option>3:00pm – 5:00pm</option></select></>}</label></div></div><label className="checkout-notes"><span>Order notes <small>Optional</small></span><textarea value={customer.notes} onChange={(event) => setCustomer({ ...customer, notes: event.target.value })} placeholder="Gate code, delivery note or anything else we should know" /></label><button className="button button-dark checkout-next" type="submit">Review your order <Icon name="arrow" size={16} /></button></form> : <div className="review-step"><h2 id="checkout-title">Ready to make it <em>official?</em></h2><p className="checkout-intro">Everything looks good. We&apos;ll confirm your order by phone and email.</p><div className="review-card"><div><span>Customer</span><strong>{customer.name}</strong><small>{customer.phone} · {customer.email}</small></div><div><span>{deliveryMethod === "delivery" ? "Deliver to" : "Pickup from"}</span><strong>{deliveryMethod === "delivery" ? customer.address : "Bite & Bloom studio"}</strong><small>{orderDate && scheduleMode === "schedule" ? `${orderDate} · ${orderTime}` : "Tomorrow · next available slot"}</small></div></div><div className="review-items">{cartItems.map((item) => <div key={item.id}><span>{item.quantity} × {item.cake.name}<small>{item.size} · {item.flavor}</small></span><strong>{formatPrice(getCustomizedPrice(item.cake, item.size, item.toppings, item.withCandles, item.withCard) * item.quantity)}</strong></div>)}</div><div className="review-total"><span>Estimated total</span><strong>{formatPrice(cartTotal)}</strong></div><div className="review-actions"><button className="button button-outline" onClick={() => setCheckoutStep("details")}>Back</button><button className="button button-dark" onClick={placeOrder}>Place order <Icon name="check" size={16} /></button></div></div>}</div><aside className="checkout-aside"><p className="eyebrow">A little preview</p><h3>Your order <em>so far.</em></h3><div className="checkout-aside-items">{cartItems.map((item) => <div key={item.id}><img src={item.cake.image} alt="" /><span>{item.quantity} × {item.cake.name}<small>{item.size} · {item.flavor}</small></span><strong>{formatPrice(getCustomizedPrice(item.cake, item.size, item.toppings, item.withCandles, item.withCard) * item.quantity)}</strong></div>)}</div><div className="checkout-aside-total"><span>Subtotal</span><strong>{formatPrice(cartSubtotal)}</strong><span>Delivery</span><strong>{deliveryFee ? formatPrice(deliveryFee) : "Free"}</strong><span>Total</span><strong>{formatPrice(cartTotal)}</strong></div><p className="checkout-aside-note"><Icon name="leaf" size={14} /> No payment is taken here. We&apos;ll contact you to confirm.</p></aside></div></div>}

      {accountOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAccountOpen(false); }}><div className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title"><button className="modal-close account-modal-close" onClick={() => setAccountOpen(false)} aria-label="Close account"><Icon name="close" size={20} /></button>{signedIn ? <div className="account-dashboard"><span className="account-avatar">B</span><p className="eyebrow">Your sweet account</p><h2 id="account-title">Welcome back, <em>{session?.user?.name || customer.name || "cake person"}.</em></h2><p>Everything you need for a smoother order, all in one place.</p><div className="account-benefits"><div><strong>—</strong><small>Loyalty points</small></div><div><strong>{order ? "1" : "0"}</strong><small>Current order</small></div><div><strong>—</strong><small>Saved addresses</small></div></div><div className="account-links"><a href="/account" onClick={() => setAccountOpen(false)}>Order history <span>↗</span></a><button onClick={() => showToast("Saved addresses are managed from your account dashboard")}>Saved addresses <span>↗</span></button><button onClick={() => { void signOut({ redirect: false }); setAccountOpen(false); showToast("You have been signed out"); }}>Sign out <span>↗</span></button></div></div> : <div className="account-auth"><span className="account-avatar"><Icon name="cake" size={22} /></span><p className="eyebrow">Bite & Bloom account</p><h2 id="account-title">Keep the good stuff <em>close.</em></h2><p>Save addresses, track orders and collect points for every sweet moment.</p><div className="auth-tabs"><button className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}>Sign in</button><button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Create account</button></div><form onSubmit={handleAuthSubmit}><label><span>Email address</span><input type="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></label><label><span>Password</span><input type="password" required minLength={6} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 6 characters" /></label><button className="button button-dark full-button" type="submit" disabled={authSubmitting}>{authSubmitting ? "Working…" : authMode === "signin" ? "Sign in" : "Create my account"} <Icon name="arrow" size={15} /></button></form><button className="google-button" type="button" disabled={!googleAvailable} onClick={() => { if (googleAvailable) void signIn("google", { callbackUrl: window.location.href }); else showToast("Google sign-in is not configured yet"); }}><FcGoogle aria-hidden="true" />Continue with Google</button><button className="guest-button" type="button" onClick={() => { setAccountOpen(false); showToast("Guest checkout is ready whenever you are"); }}>Continue as guest</button><div className="account-auth-links"><p>Need an account? <a className="auth-link" href="/register" onClick={() => setAccountOpen(false)}>Create one</a></p><p><a className="auth-link" href="/resend-verification" onClick={() => setAccountOpen(false)}>Need a new verification link?</a></p></div></div>}</div></div>}

      {selectedCake && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedCake(null); }}><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title"><button className="modal-close" onClick={() => setSelectedCake(null)} aria-label="Close product details"><Icon name="close" size={20} /></button><div className="product-gallery"><div className="product-main-image image-sheen"><img src={selectedCake.images[activeImage]} alt={selectedCake.name} /></div><div className="product-thumbnails">{selectedCake.images.map((image, index) => <button key={image} className={activeImage === index ? "active" : ""} onClick={() => setActiveImage(index)}><img src={image} alt={`${selectedCake.name} view ${index + 1}`} /></button>)}</div></div><div className="product-details"><div className="product-kicker"><span>{selectedCake.category}</span><span><Icon name="star" size={13} /> {selectedCake.rating} · {selectedCake.reviews} reviews</span></div><h2 id="product-title">{selectedCake.name}</h2><p className="product-description">{selectedCake.description}</p><strong className="product-price">From {formatPrice(selectedCake.price)}</strong><div className="customizer"><div className="customizer-section"><div className="customizer-label"><strong>Choose a size</strong><span>Required</span></div><div className="option-grid option-grid-3">{["0.5 kg", "1 kg", "2 kg"].map((size) => <button key={size} className={selectedSize === size ? "selected" : ""} onClick={() => setSelectedSize(size)}>{size}</button>)}</div></div><div className="customizer-section"><div className="customizer-label"><strong>Pick a flavor</strong><span>Required</span></div><div className="option-grid">{selectedCake.flavors.map((flavor) => <button key={flavor} className={selectedFlavor === flavor ? "selected" : ""} onClick={() => setSelectedFlavor(flavor)}>{flavor}</button>)}</div></div><div className="customizer-two-col"><div className="customizer-section"><div className="customizer-label"><strong>Shape</strong></div><div className="option-grid">{selectedCake.shapes.map((shape) => <button key={shape} className={selectedShape === shape ? "selected" : ""} onClick={() => setSelectedShape(shape)}>{shape}</button>)}</div></div><div className="customizer-section"><div className="customizer-label"><strong>Finish</strong></div><select className="select-control" value={theme} onChange={(event) => setTheme(event.target.value)}><option>Whipped cream</option><option>Buttercream</option><option>Naked finish</option><option>Chocolate ganache</option></select></div></div><div className="customizer-section"><div className="customizer-label"><strong>Your message</strong><span>Optional</span></div><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="e.g. Happy birthday, Amara!" maxLength={80} /><small className="field-hint">{message.length}/80 characters</small></div><div className="customizer-section"><div className="customizer-label"><strong>Make it yours</strong><span>Optional extras</span></div><div className="extra-grid">{["Fresh fruit", "Edible flowers", "Chocolate curls", "Macarons"].map((topping) => <button key={topping} className={toppings.includes(topping) ? "selected" : ""} onClick={() => toggleTopping(topping)}><span className="extra-check">{toppings.includes(topping) && <Icon name="check" size={13} />}</span>{topping}</button>)}</div><div className="upload-control upload-control-disabled" role="note"><Icon name="upload" size={17} /><span><strong>Inspiration uploads are not configured</strong><small>Connect verified media storage before sharing reference images. Your cake request can still include a message and theme.</small></span></div><div className="toggle-options"><label><input type="checkbox" checked={withCandles} onChange={(event) => setWithCandles(event.target.checked)} /><span className="fake-toggle" />Add candles <b>+ KSh 250</b></label><label><input type="checkbox" checked={withCard} onChange={(event) => setWithCard(event.target.checked)} /><span className="fake-toggle" />Add a greeting card <b>+ KSh 350</b></label></div></div></div><div className="add-cart-row"><div><small>Total from</small><strong>{formatPrice(customizationPrice)}</strong></div><button className="button button-dark" onClick={addToCart}>Add to cart <Icon name="cart" size={17} /></button></div><p className="allergen-note"><Icon name="leaf" size={14} /> {selectedCake.ingredients} <br /><span>Allergen note: {selectedCake.allergens}</span></p></div></div></div>}
      {toast && <div className="toast" role="status"><span><Icon name="check" size={16} /></span>{toast}</div>}

      <PublicFloatingActions message={whatsappMessage} />
    </div>
  );
}
