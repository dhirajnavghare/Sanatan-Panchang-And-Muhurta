# Contributing to Sanatan (सनातन)

Thank you for your interest in contributing to **Sanatan**! 🙏

Our mission is to build the world’s most mathematically precise, privacy-first, 100% offline, and universally accessible Vedic spiritual application and calculation engine.

Whether you are an astronomer, mobile developer, Sanskrit scholar, translator, or spiritual enthusiast, your contributions are warmly welcomed.

---

## 📜 Table of Contents
1. [Core Principles](#-core-principles)
2. [Development Setup](#-development-setup)
3. [Architecture Overview](#-architecture-overview)
4. [Contribution Guidelines](#-contribution-guidelines)
   - [Adding or Refining Festivals](#adding-or-refining-festivals)
   - [Adding Sacred Prayers or Stotras](#adding-sacred-prayers-or-stotras)
   - [Adding Languages & Translations](#adding-languages--translations)
   - [Enhancing Astronomical Algorithms](#enhancing-astronomical-algorithms)
5. [Pull Request Process](#-pull-request-process)
6. [Code Style & Standards](#-code-style--standards)

---

## 🕊️ Core Principles

Every contribution must adhere to three foundational pillars:

1. **100% Offline-First:**
   - The application must compute all astronomical events, Panchang elements, Muhurtas, and dates on-device in pure TypeScript.
   - **Zero external network requests** are permitted for core calculations or user data.
2. **Zero Tracking & Absolute Privacy:**
   - No analytics SDKs, advertising IDs, or tracking cookies. All user data (Gotra, Rashi, Name, Preferences) stays strictly on the user's device (`AsyncStorage`).
3. **Mathematical & Shastra Authenticity:**
   - Calculations must be backed by authentic astronomical ephemeris (NASA JPL VSOP87, Chapront ELP-2000, IAU theory) and canonical shastra rules (e.g. *Muhurta Chintamani*, *Nirnaya Sindhu*, *Dharmasindhu*).

---

## 💻 Development Setup

### Prerequisites
- **Node.js**: v18 or v20 LTS
- **Package Manager**: `npm` (or `bun` / `yarn`)
- **Mobile Environment**:
  - [Expo Go](https://expo.dev/go) app installed on your physical Android or iOS device, OR
  - Android Studio Emulator / Xcode iOS Simulator.

### Getting Started

1. **Fork and Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/sanatan.cc.react.native.git
   cd sanatan.cc.react.native
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Expo development server:**
   ```bash
   npm start
   ```
   - Scan the terminal QR code with **Expo Go** on Android.
   - Press `a` to run on an active Android Emulator.
   - Press `i` to run on an iOS Simulator.
   - Press `w` to run on web.

4. **Run Verification Commands:**
   Always verify type safety and tests before submitting changes:
   ```bash
   npm run typecheck   # npx tsc --noEmit
   npm test            # Runs all 27 Jest test suites
   ```

---

## 🏛️ Architecture Overview

```
sanatan.cc.react.native/
├── app/                        # Expo Router Navigation & Screen Layouts
│   ├── (tabs)/
│   │   ├── index.tsx           # दिनचर्या (Dinacharya & Panchang Home)
│   │   ├── muhurta.tsx         # मुहूर्त (Shubh Muhurta Finder)
│   │   ├── festivals.tsx       # पर्व-व्रत (Annual Festivals Timeline)
│   │   ├── prayers.tsx         # स्तोत्र-जाप (Prayers & Japa Counter)
│   │   └── more.tsx            # तीर्थ व सेटिंग्स (Tirthas & Settings)
│   └── _layout.tsx             # Root layout with Language & Tour Providers
├── src/
│   ├── core/                   # 100% Offline Pure TypeScript Calculation Engines
│   │   ├── panchang/           # VSOP87 Sun, ELP-2000 Moon, Tithi, Nakshatra, Yoga, Karana
│   │   ├── muhurta-finder/     # Shastra algorithms & 180-day Muhurta discovery
│   │   ├── festivals/          # Festival timeline & metadata
│   │   ├── prayers/            # Sanskrit stotras, chalisas, and mantras
│   │   ├── temples/            # 31 pilgrimage sanctuaries database
│   │   └── i18n/               # Language definitions & string formatters
│   ├── services/               # State, audio, haptics & notifications services
│   └── components/             # Reusable UI cards, modals, and tour spotlights
└── __tests__/                  # Comprehensive Jest test suites
```

---

## 🤝 Contribution Guidelines

### Adding or Refining Festivals
Festival definitions reside in `src/core/festivals/metadata.ts` and `src/core/panchang/festivals.ts`.
- Ensure dates are calculated algorithmically based on Tithi, Masa (Chaitra to Phalguna), and Paksha (Shukla/Krishna).
- Include descriptions in both Devanagari Hindi and English.
- Cite classical shastras (e.g., *Nirnaya Sindhu*) for Vrat rules and Parana timings.

### Adding Sacred Prayers or Stotras
Stotras and prayers live in `src/core/prayers/data.ts`.
- Ensure Sanskrit verses are in correct Devanagari Unicode.
- Include accurate IAST transliteration, line-by-line meanings, and the Phala Shruti (spiritual benefits).

### Adding Languages & Translations
We actively welcome translations in all regional languages:
- Translations are centralized in `src/core/i18n/translations.ts` and `src/core/i18n/formatters.ts`.
- Please ensure traditional spiritual terms are preserved with cultural sanctity.

### Enhancing Astronomical Algorithms
Astronomy functions live in `src/core/panchang/astronomy.ts`:
- Use Julian Day / Julian Ephemeris Century equations.
- Include unit tests in `__tests__/panchang.test.ts` verifying accuracy against NASA JPL Horizons benchmarks.

---

## 🚀 Pull Request Process

1. **Create a branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Commit your changes:**
   Use clear, conventional commit messages:
   - `feat(panchang): add topocentric lunar parallax correction`
   - `fix(tour): correct spotlight alignment on small screens`
   - `docs(readme): clarify local setup instructions`
3. **Verify locally:**
   ```bash
   npm run typecheck
   npm test
   ```
   **PRs will only be merged when all tests and typechecks pass.**
4. **Open a Pull Request:**
   Fill out the PR template thoroughly, linking any related issues.

---

## 📜 Code Style & Standards

- **TypeScript**: Strict typing without `any` whenever possible.
- **Naming Conventions**:
  - Components: `PascalCase.tsx`
  - Functions & Utilities: `camelCase.ts`
  - Constants: `UPPER_SNAKE_CASE`
- **Mobile First**: Design for touch targets ≥ 34×34dp and verify responsiveness across diverse Android screen resolutions.
