"use client";

import { useEffect, useMemo, useState } from "react";

type IconName =
  | "arrow"
  | "cake"
  | "cart"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "facebook"
  | "heart"
  | "instagram"
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
  | "upload";

type Cake = {
  id: number;
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
};

const imageBase = "https://images.unsplash.com/";

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
    image: `${imageBase}photo-1535254973040-6b8c2c0a6d3c?auto=format&fit=crop&w=1000&q=85`,
    images: [
      `${imageBase}photo-1535254973040-6b8c2c0a6d3c?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=85`,
      `${imageBase}photo-1519869325930-281384150729?auto=format&fit=crop&w=1000&q=85`,
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
  { name: "Weddings", category: "Wedding", note: "For the forever kind", image: cakes[4].image },
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
    facebook: <path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v5h3v-5h3l1-3h-4V9a1 1 0 0 1 1-1Z" />,
    heart: <path d="M20.8 8.7c0 5.5-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />,
    instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
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
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function formatPrice(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All cakes");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [likedCakes, setLikedCakes] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState("");
  const [selectedSize, setSelectedSize] = useState("1 kg");
  const [selectedFlavor, setSelectedFlavor] = useState("Vanilla berry");
  const [selectedShape, setSelectedShape] = useState("Round");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("Whipped cream");
  const [toppings, setToppings] = useState<string[]>([]);
  const [withCandles, setWithCandles] = useState(false);
  const [withCard, setWithCard] = useState(false);
  const [uploadName, setUploadName] = useState("");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("bite-bloom-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;
    setDarkMode(shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("bite-bloom-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.body.style.overflow = selectedCake ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCake]);

  const filteredCakes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = cakes.filter((cake) => {
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
  }, [activeCategory, search, sortBy]);

  const customizationPrice = selectedCake
    ? Math.round(
        selectedCake.price * (selectedSize === "0.5 kg" ? 0.65 : selectedSize === "2 kg" ? 1.8 : 1) +
          (withCandles ? 250 : 0) +
          (withCard ? 350 : 0) +
          toppings.length * 180,
      )
    : 0;

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
    setUploadName("");
  }

  function addToCart() {
    if (!selectedCake) return;
    setCartCount((count) => count + 1);
    setSelectedCake(null);
    showToast(`${selectedCake.name} is in your cart`);
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

  return (
    <div className="site-shell">
      <div className="topline">
        <div className="container topline-inner">
          <span><Icon name="sparkle" size={14} /> Freshly baked, thoughtfully delivered across Nairobi</span>
          <span className="topline-hide-mobile">Need a little help? <a href="tel:+254711222333">+254 711 222 333</a></span>
        </div>
      </div>

      <header className="site-header">
        <div className="container nav-wrap">
          <a href="#top" className="brand" aria-label="Bite and Bloom home">
            <span className="brand-mark"><Icon name="cake" size={24} /></span>
            <span><strong>BITE <i>&</i> BLOOM</strong><small>CAKE STUDIO</small></span>
          </a>
          <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            <a href="#collection" onClick={() => setMenuOpen(false)}>Shop cakes</a>
            <a href="#occasions" onClick={() => setMenuOpen(false)}>Occasions</a>
            <a href="#our-story" onClick={() => setMenuOpen(false)}>Our story</a>
            <a href="#delivery" onClick={() => setMenuOpen(false)}>Delivery</a>
          </nav>
          <div className="nav-actions">
            <button className="icon-button" onClick={() => document.getElementById("cake-search")?.focus()} aria-label="Search cakes"><Icon name="search" /></button>
            <button className="icon-button theme-toggle" onClick={toggleDarkMode} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon name={darkMode ? "sun" : "moon"} size={19} />
            </button>
            <button className="cart-button" onClick={() => showToast(cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""} ready to check out` : "Your cart is waiting for something sweet")} aria-label="Open cart">
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
              <div className="hero-image-main image-sheen"><img src={cakes[0].image} alt="Strawberry cake with fresh flowers" /></div>
              <div className="hero-image-small image-sheen"><img src={cakes[2].image} alt="Lemon cake slice" /></div>
              <div className="hero-note glass-card"><span className="note-stamp">01</span><strong>Sweet things,<br />made slowly.</strong><small>Since 2018 · Nairobi</small></div>
              <div className="hero-float">Baked with <span>♡</span><br />in every layer</div>
              <div className="hero-sun" />
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="Bite and Bloom values">
          <div className="ticker-track"><span>Made to order</span><b>✦</b><span>Seasonal ingredients</span><b>✦</b><span>Delivery across Nairobi</span><b>✦</b><span>Made to order</span><b>✦</b><span>Seasonal ingredients</span><b>✦</b><span>Delivery across Nairobi</span></div>
        </div>

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
                  <button className={`heart-button ${likedCakes.includes(cake.id) ? "liked" : ""}`} onClick={(event) => { event.stopPropagation(); setLikedCakes((current) => current.includes(cake.id) ? current.filter((id) => id !== cake.id) : [...current, cake.id]); }} aria-label={likedCakes.includes(cake.id) ? `Remove ${cake.name} from favorites` : `Add ${cake.name} to favorites`}><Icon name="heart" size={18} /></button>
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
          <div className="container promo-grid"><div className="promo-card promo-main"><div><p className="eyebrow">For the last-minute lovers</p><h2>Tomorrow tastes<br /><em>this good.</em></h2><p>Order by noon for next-day delivery in Nairobi.</p><button className="button button-light" onClick={scrollToCollection}>Shop ready-to-love <Icon name="arrow" size={17} /></button></div><div className="promo-image"><img src={cakes[3].image} alt="Pink cake with flowers" /></div></div><div className="promo-card promo-side"><span className="promo-side-icon"><Icon name="cake" size={28} /></span><p className="eyebrow">Make it yours</p><h3>Your cake,<br /><em>your story.</em></h3><p>Add a message, colors, toppings and all the tiny things that make it feel like you.</p><button className="text-link text-link-light" onClick={() => openCake(cakes[0])}>Start customizing <span>↗</span></button></div></div>
        </section>

        <section className="section testimonials-section">
          <div className="container"><div className="section-heading heading-row"><div><p className="eyebrow">From the cake people</p><h2>Words we <em>keep</em> close.</h2></div><div className="quote-mark">“</div></div><div className="testimonial-grid">{testimonials.map((testimonial) => <figure className="testimonial-card" key={testimonial.name}><div className="testimonial-stars"><Icon name="star" size={13} /><Icon name="star" size={13} /><Icon name="star" size={13} /><Icon name="star" size={13} /><Icon name="star" size={13} /></div><blockquote>“{testimonial.quote}”</blockquote><figcaption><span className="review-avatar">{testimonial.name.split(" ").map((part) => part[0]).join("")}</span><span><strong>{testimonial.name}</strong><small>{testimonial.detail}</small></span></figcaption></figure>)}</div></div>
        </section>

        <section className="delivery-section" id="delivery"><div className="container delivery-grid"><div className="delivery-copy"><p className="eyebrow">Come on over, or stay cosy</p><h2>We bring the good stuff <em>to you.</em></h2><p>We deliver Monday to Saturday across Nairobi, with careful timing and an extra layer of protection for your cake.</p><div className="delivery-detail"><Icon name="pin" size={20} /><span><strong>Where we deliver</strong><small>Kilimani · Lavington · Westlands · Karen · Kileleshwa<br />CBD · Parklands · Runda · Gigiri and nearby areas</small></span></div><div className="delivery-detail"><Icon name="clock" size={20} /><span><strong>When we bake</strong><small>Mon–Sat, 8:00am–6:00pm<br />Same-day collection from our Kilimani studio</small></span></div></div><div className="contact-card glass-card"><span className="contact-script">Let&apos;s make it sweet</span><h3>Have something<br /><em>in mind?</em></h3><p>Tell us what you&apos;re dreaming up. We&apos;ll help you make it real.</p><a href="mailto:hello@biteandbloom.co.ke" className="contact-line"><Icon name="mail" size={17} /> hello@biteandbloom.co.ke</a><a href="tel:+254711222333" className="contact-line"><Icon name="phone" size={17} /> +254 711 222 333</a><a className="button button-dark full-button" href="mailto:hello@biteandbloom.co.ke?subject=Custom%20cake%20enquiry">Start a conversation <Icon name="send" size={16} /></a></div></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-top"><div className="footer-brand"><a href="#top" className="brand"><span className="brand-mark"><Icon name="cake" size={24} /></span><span><strong>BITE <i>&</i> BLOOM</strong><small>CAKE STUDIO</small></span></a><p>A little more joy, one slice at a time.</p><div className="social-links"><a href="https://instagram.com" aria-label="Instagram"><Icon name="instagram" size={17} /></a><a href="https://facebook.com" aria-label="Facebook"><Icon name="facebook" size={17} /></a></div></div><div className="footer-column"><strong>Explore</strong><a href="#collection">Shop cakes</a><a href="#occasions">Occasions</a><a href="#our-story">Our story</a></div><div className="footer-column"><strong>Need to know</strong><a href="#delivery">Delivery areas</a><a href="#delivery">FAQs</a><a href="mailto:hello@biteandbloom.co.ke">Contact us</a></div><div className="newsletter"><strong>Get the good stuff</strong><p>Seasonal menus, early drops and a little sweetness in your inbox.</p><form onSubmit={(event) => { event.preventDefault(); showToast("You are on the sweet list ✦"); }}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" required placeholder="Your email address" /><button type="submit" aria-label="Subscribe"><Icon name="arrow" size={17} /></button></form></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Bite & Bloom. Made with care in Nairobi.</span><span>Privacy · Terms · <a href="#top">Back to top ↑</a></span></div></footer>

      {selectedCake && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedCake(null); }}><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title"><button className="modal-close" onClick={() => setSelectedCake(null)} aria-label="Close product details"><Icon name="close" size={20} /></button><div className="product-gallery"><div className="product-main-image image-sheen"><img src={selectedCake.images[activeImage]} alt={selectedCake.name} /></div><div className="product-thumbnails">{selectedCake.images.map((image, index) => <button key={image} className={activeImage === index ? "active" : ""} onClick={() => setActiveImage(index)}><img src={image} alt={`${selectedCake.name} view ${index + 1}`} /></button>)}</div></div><div className="product-details"><div className="product-kicker"><span>{selectedCake.category}</span><span><Icon name="star" size={13} /> {selectedCake.rating} · {selectedCake.reviews} reviews</span></div><h2 id="product-title">{selectedCake.name}</h2><p className="product-description">{selectedCake.description}</p><strong className="product-price">From {formatPrice(selectedCake.price)}</strong><div className="customizer"><div className="customizer-section"><div className="customizer-label"><strong>Choose a size</strong><span>Required</span></div><div className="option-grid option-grid-3">{["0.5 kg", "1 kg", "2 kg"].map((size) => <button key={size} className={selectedSize === size ? "selected" : ""} onClick={() => setSelectedSize(size)}>{size}</button>)}</div></div><div className="customizer-section"><div className="customizer-label"><strong>Pick a flavor</strong><span>Required</span></div><div className="option-grid">{selectedCake.flavors.map((flavor) => <button key={flavor} className={selectedFlavor === flavor ? "selected" : ""} onClick={() => setSelectedFlavor(flavor)}>{flavor}</button>)}</div></div><div className="customizer-two-col"><div className="customizer-section"><div className="customizer-label"><strong>Shape</strong></div><div className="option-grid">{selectedCake.shapes.map((shape) => <button key={shape} className={selectedShape === shape ? "selected" : ""} onClick={() => setSelectedShape(shape)}>{shape}</button>)}</div></div><div className="customizer-section"><div className="customizer-label"><strong>Finish</strong></div><select className="select-control" value={theme} onChange={(event) => setTheme(event.target.value)}><option>Whipped cream</option><option>Buttercream</option><option>Naked finish</option><option>Chocolate ganache</option></select></div></div><div className="customizer-section"><div className="customizer-label"><strong>Your message</strong><span>Optional</span></div><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="e.g. Happy birthday, Amara!" maxLength={80} /><small className="field-hint">{message.length}/80 characters</small></div><div className="customizer-section"><div className="customizer-label"><strong>Make it yours</strong><span>Optional extras</span></div><div className="extra-grid">{["Fresh fruit", "Edible flowers", "Chocolate curls", "Macarons"].map((topping) => <button key={topping} className={toppings.includes(topping) ? "selected" : ""} onClick={() => toggleTopping(topping)}><span className="extra-check">{toppings.includes(topping) && <Icon name="check" size={13} />}</span>{topping}</button>)}</div><label className="upload-control"><Icon name="upload" size={17} /><span><strong>{uploadName || "Upload inspiration image"}</strong><small>{uploadName ? "Ready to share with our baker" : "JPG or PNG · up to 5MB"}</small></span><input type="file" accept="image/png,image/jpeg" onChange={(event) => setUploadName(event.target.files?.[0]?.name ?? "")} /></label><div className="toggle-options"><label><input type="checkbox" checked={withCandles} onChange={(event) => setWithCandles(event.target.checked)} /><span className="fake-toggle" />Add candles <b>+ KSh 250</b></label><label><input type="checkbox" checked={withCard} onChange={(event) => setWithCard(event.target.checked)} /><span className="fake-toggle" />Add a greeting card <b>+ KSh 350</b></label></div></div></div><div className="add-cart-row"><div><small>Total from</small><strong>{formatPrice(customizationPrice)}</strong></div><button className="button button-dark" onClick={addToCart}>Add to cart <Icon name="cart" size={17} /></button></div><p className="allergen-note"><Icon name="leaf" size={14} /> {selectedCake.ingredients} <br /><span>Allergen note: {selectedCake.allergens}</span></p></div></div></div>}
      {toast && <div className="toast" role="status"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </div>
  );
}
