# Sharif Group — Design System & CSS Style Guide

> **Purpose:** This specification serves as the single source of truth for the **Sharif Group** visual identity, color palette, typography, UI components, and CSS architecture. When redesigning or extending pages, maintain these rules and design tokens to ensure visual consistency and high-end luxury aesthetics across all touchpoints.

---

## 1. Brand Identity & Design Principles

Sharif Group is an elite, government-authorized advisory firm based in Dubai specializing in Citizenship by Investment, European Golden Visas, UAE 10-Year Golden Visas, and luxury real estate.

* **Aesthetic Tone:** Quiet Luxury, Prestigious, Minimalist, Nocturnal Warmth, Precision.
* **Palette Harmony:** Champagne Sand Gold paired with deep charcoal/midnight and warm parchment off-whites.
* **Micro-Interactions:** Subtle ambient glows, smooth cubic-bezier transitions (`cubic-bezier(0.16, 1, 0.3, 1)`), glassmorphic backdrops, and refined pill-shaped controls.

---

## 2. Core Color Palette

### 2.1 Primary Luxury Colors

| Token Name | Hex Code | RGB / RGBA | Role / Usage |
| :--- | :--- | :--- | :--- |
| **`luxury-gold`** | `#C5A880` | `rgb(197, 168, 128)` | Primary brand accent, active states, glowing borders, active navigation, icons, scrollbar thumb |
| **`luxury-goldhover`** | `#B3946B` | `rgb(179, 148, 107)` | Hover state for buttons, links, and pressed elements |
| **`gold-bronze`** | `#786142` | `rgb(120, 97, 66)` | Secondary contrast border, eligibility checker button, dark gold badges |
| **`admin-gold`** | `#B38E5D` | `rgb(179, 142, 93)` | Primary accent for the Admin Dashboard / CMS |
| **`admin-gold-hover`** | `#9C7744` | `rgb(156, 119, 68)` | Admin Dashboard button & item hover state |

### 2.2 Backgrounds & Surfaces

| Token Name | Hex Code | Description | Role / Usage |
| :--- | :--- | :--- | :--- |
| **`luxury-light`** | `#FDFCFB` | Pure Parchment / Warm Light | Main page body background, scrollbar track, light cards |
| **`luxury-sectionOff`** | `#F5F2EB` | Off-White Pearl | Alternate section background, testimonial blocks |
| **`luxury-sectionCopper`** | `#FAF6EE` | Cream Warmth | Feature cards, highlight banners, soft contrasts |
| **`surface-white`** | `#FFFFFF` | Pure White | Modals, dropdown menus, glass cards, admin surface |
| **`surface-admin-bg`** | `#F8FAFC` | Slate Light | Admin Dashboard backdrop |
| **`surface-admin-card`** | `#F1F5F9` | Slate Gray Tint | Admin preview panels & secondary wells |

### 2.3 Dark & Nocturnal Colors (Dark Mode / Feature Banners)

| Token Name | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| **`luxury-dark`** | `#111111` | Primary dark tone, high-contrast hero sections, footer background, primary body text on light backgrounds |
| **`midnight-dark`** | `#070E1A` | Deep nocturnal navy used in feature accordions, program cards, and neon glow containers |
| **`midnight-card`** | `#0C1424` | Active accordion background, high-end dark card surface |
| **`neutral-950`** | `#0A0A0A` | Image badges, dark overlay backdrops |

### 2.4 Neutral Grays & Borders

| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **`text-dark`** | `#0F172A` / `#111111` | Headings, bold statements, high-readability copy |
| **`text-muted`** | `#64748B` / `#71717A` | Sub-labels, dates, helper hints |
| **`luxury-gray`** | `#8E8E93` | Metadata, passive icons, secondary captions |
| **`luxury-border`** | `#E5E5EA` | Default border for cards, dividers, input elements |
| **`dark-border`** | `rgba(255, 255, 255, 0.12)` | Subtle borders on dark cards & accordions |

### 2.5 Functional & Status Colors

| Token Name | Hex Code | Role |
| :--- | :--- | :--- |
| **Success** | `#16A34A` | Verification badges, success alerts, valid passport statuses |
| **Danger / Error** | `#DC2626` | Error notifications, invalid inputs, rejection tags |
| **Warning** | `#D97706` | Pending approvals, processing status chips |

---

## 3. Typography System

### 3.1 Font Families

```css
/* Primary Latin Stack */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-serif: 'Playfair Display', Georgia, 'Times New Roman', serif;

/* Multilingual Stacks */
--font-arabic: 'Cairo', system-ui, -apple-system, sans-serif;
--font-persian: 'Vazirmatn', system-ui, -apple-system, sans-serif;
--font-chinese: 'Noto Sans SC', system-ui, -apple-system, sans-serif;
```

### 3.2 Typography Hierarchy & Usage Rules

1. **Brand Headings (`h1`, `h2`):**
   * Use `font-serif` (`Playfair Display`) with `font-bold` (`700`).
   * **Signature Style:** Pair standard serif text with an *italicized gold highlight*:
     ```html
     <h2 class="font-serif text-3xl md:text-5xl text-neutral-900 font-bold leading-tight">
       Required <span class="italic text-luxury-gold font-serif font-normal">Documents</span>
     </h2>
     ```
2. **Body & User Interface:**
   * Use `font-sans` (`Inter`).
   * Weights: Light (`300`), Regular (`400`), Medium (`500`), Semi-bold (`600`).
3. **Pill Buttons, Badges & Navigation:**
   * Always **uppercase** with wide letter spacing:
   * Tracking values: `tracking-[0.1em]`, `tracking-[0.18em]`, or `tracking-widest`.
   * Font size: `text-[10px]` to `text-[12px]`, `font-bold`.

---

## 4. Ready-to-Use CSS Variables (`:root`)

Include this block in your global CSS (or `<style>` header) to standardize styles without Tailwind dependency:

```css
:root {
  /* Brand Luxury Palette */
  --luxury-gold: #C5A880;
  --luxury-gold-hover: #B3946B;
  --luxury-gold-bronze: #786142;
  --luxury-gold-glow: rgba(197, 168, 128, 0.6);
  --luxury-gold-dim: rgba(197, 168, 128, 0.15);

  /* Backgrounds */
  --luxury-light: #FDFCFB;
  --luxury-dark: #111111;
  --luxury-midnight-dark: #070E1A;
  --luxury-midnight-card: #0C1424;
  --luxury-section-off: #F5F2EB;
  --luxury-section-copper: #FAF6EE;

  /* Neutrals & Borders */
  --luxury-gray: #8E8E93;
  --luxury-border: #E5E5EA;
  --luxury-border-dark: rgba(255, 255, 255, 0.12);
  --luxury-text-primary: #111111;
  --luxury-text-muted: #64748B;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  /* Motion & Easing */
  --transition-smooth: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --transition-cinematic: all 1.8s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 5. Tailwind Configuration (`tailwind.config.js`)

Ensure your `tailwind.config.js` extends the theme with these tokens:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./**/*.html",
    "./assets/js/**/*.js",
    "./admin/**/*.js",
    "./admin/**/*.html",
    "./admin/**/*.php",
    "./blog/**/*.html",
    "./programs/**/*.html",
    "./**/*.json"
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: '#C5A880',
          goldhover: '#B3946B',
          dark: '#111111',
          light: '#FDFCFB',
          gray: '#8E8E93',
          border: '#E5E5EA',
          sectionOff: '#F5F2EB',
          sectionCopper: '#FAF6EE'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif']
      }
    }
  },
  plugins: []
};
```

---

## 6. Signature Design Patterns & Reusable Components

### 6.1 Custom Scrollbar
```css
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #FDFCFB;
}
::-webkit-scrollbar-thumb {
  background: #C5A880;
  border-radius: 3px;
}
```

### 6.2 Glassmorphism & Mega-Blur
```css
.mega-blur {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.05);
}
```

### 6.3 Premium & Neon Hover Cards
Used for program cards, services, and trust features:

```css
/* Subtle Light Card Hover */
.premium-hover {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(229, 229, 234, 0.8);
}
.premium-hover:hover {
  border-color: #C5A880 !important;
  box-shadow: 0 0 25px rgba(197, 168, 128, 0.6), inset 0 0 10px rgba(197, 168, 128, 0.2) !important;
  transform: translateY(-3px);
}

/* Nocturnal / Dark Card Neon Glow */
.neon-card-hover {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.neon-card-hover:hover {
  border-color: #C5A880 !important;
  box-shadow: 0 0 35px rgba(197, 168, 128, 0.75), inset 0 0 15px rgba(197, 168, 128, 0.25) !important;
  transform: translateY(-4px);
}
```

### 6.4 Luxury Buttons

#### Primary Pill Button (Gold Outline to Solid Hover)
```html
<a href="/contact/" 
   class="px-5 py-2.5 rounded-full border border-neutral-900 text-neutral-900 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-luxury-gold hover:border-luxury-gold hover:text-white transition-all duration-300">
  Book Consultation
</a>
```

#### Secondary Pill Button (Bronze Accent)
```html
<a href="/eligibilitychecker/" 
   class="px-5 py-2.5 rounded-full border border-[#786142] text-[#786142] text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-[#786142] hover:text-white transition-all duration-300">
  Eligibility Checker
</a>
```

#### Dark Mode Glowing Button
```html
<button class="px-8 py-3 border border-luxury-gold/50 text-xs tracking-[0.2em] uppercase text-white hover:bg-luxury-dark hover:text-luxury-gold hover:border-luxury-gold transition-all duration-500 rounded-full cursor-pointer shadow-[0_0_15px_rgba(197,168,128,0.2)] hover:shadow-[0_0_25px_rgba(197,168,128,0.5)]">
  Explore Programs
</button>
```

### 6.5 Cinematic Accordion Pattern
Used on landing pages for interactive feature highlights:

```css
.focus-acc-item {
  transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 1.2s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 1.2s cubic-bezier(0.16, 1, 0.3, 1),
              background-color 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.focus-acc-item.is-active {
  border-color: #C5A880 !important;
  box-shadow: 0 0 50px rgba(197, 168, 128, 0.8), inset 0 0 22px rgba(197, 168, 128, 0.35) !important;
  transform: translateY(-4px);
  background-color: rgba(12, 20, 36, 0.98) !important;
}

.focus-acc-item.is-active .focus-acc-icon {
  background-color: #C5A880 !important;
  color: #ffffff !important;
  border-color: #C5A880 !important;
  box-shadow: 0 0 30px rgba(197, 168, 128, 0.95) !important;
  transform: scale(1.15) rotate(12deg);
}
```

### 6.6 Slider & Carousel Dots
```css
.review-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  padding: 0;
}

.review-dot.active {
  width: 28px;
  background-color: #C5A880;
  box-shadow: 0 0 10px rgba(197, 168, 128, 0.5);
}
```

---

## 7. Multilingual & RTL Typography Guidelines

When switching languages, use specific typefaces to preserve high visual fidelity while honoring script geometry:

```css
/* Arabic (ar) */
html[lang="ar"] body, body.lang-ar {
  font-family: 'Cairo', system-ui, -apple-system, sans-serif !important;
}

/* Persian / Farsi (fa) */
html[lang="fa"] body, body.lang-fa {
  font-family: 'Vazirmatn', system-ui, -apple-system, sans-serif !important;
}

/* Simplified Chinese (zh) */
html[lang="zh"] body, body.lang-zh {
  font-family: 'Noto Sans SC', system-ui, -apple-system, sans-serif !important;
}

/* RTL directional flips */
[dir="rtl"] .fa-arrow-right,
[dir="rtl"] .fa-chevron-right {
  transform: scaleX(-1);
}
```

---

## 8. Development & Re-compilation Workflow

1. **Edit Input Styles:**
   Place custom CSS or `@tailwind` directives in `assets/css/tailwind-input.css`.
2. **Recompile Minified Production CSS:**
   Run the root batch script:
   ```cmd
   build_css.bat
   ```
   Or invoke Tailwind CLI directly:
   ```bash
   npx tailwindcss -i assets/css/tailwind-input.css -o assets/css/tailwind.min.css --minify
   ```
3. **HTML Link:**
   Ensure each page references the compiled bundle:
   ```html
   <link rel="stylesheet" href="/assets/css/tailwind.min.css?v=20260920_v1" />
   ```
