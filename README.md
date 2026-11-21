# Sanatan (सनातन) — Vedic Panchang, Muhurta & Sadhana

[![CI Status](https://github.com/dhirajnavghare/sanatan.cc.react.native/actions/workflows/ci.yml/badge.svg)](https://github.com/dhirajnavghare/sanatan.cc.react.native/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20v5-blue.svg)](https://www.typescriptlang.org/)
[![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-black.svg)](https://docs.expo.dev/)
[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-green.svg)](https://unlicense.org/)
[![Offline First](https://img.shields.io/badge/100%25-Offline--First-orange.svg)](#)
[![No Tracking](https://img.shields.io/badge/Privacy-Zero%20Tracking-success.svg)](#)

A 100% offline-first, mathematically authentic Vedic Panchang, Shubh Muhurta, Festival Calendar, and Sacred Prayers mobile application built with **React Native (Expo SDK 58)** and pure TypeScript ephemeris calculations.

---

## 🌟 Key Features

1. **100% Offline Standalone Calculation Engine:**
   - Powered by on-device implementations of NASA JPL VSOP87, Chapront ELP-2000, and spherical trigonometry.
   - Computes Tithi, Nakshatra, Yoga, Karana, Vara, Sunrise, Sunset, and 16 Choghadiyas in **< 1ms** on-device without internet.
2. **Shubh Muhurta Finder:**
   - Algorithmic discovery across 30 to 180 days for Griha Pravesh, Vivaha, Vehicle, Business, Property, and Gold purchase.
   - Evaluates *Muhurta Chintamani* shastra rules with Bhadra exclusions.
3. **Interactive Guided App Tour:**
   - Immersive 30-step walkthrough introducing every tab, Hindu Day Planner, temple bell chimes, and WhatsApp sharing.
4. **Annual Festivals Timeline:**
   - 150+ chronological celebrations and fasts across 2025, 2026, and 2027.
5. **Sacred Prayers & Japa Counter:**
   - Verse-by-verse chanting with authentic Sanskrit Devanagari, transliteration, and spiritual meanings.
   - Built-in tactile 108-bead Japa Mala counter with repetition tracking and haptic feedback.
6. **GPS Geolocation & Holy Tirthas:**
   - One-click GPS coordinate detection via `expo-location` with zero network tracking.
   - Directory of 12 Jyotirlingas, 4 Char Dhams, and Pancha Bhootas with local darshan schedules.
7. **Bilingual Support & Regional Calendars:**
   - 1-tap instant switch between pure Hindi (हिन्दी) and English (EN).
   - Regional calendar support: Purnimanta (North India) vs. Amanta (West & South India).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or v20 LTS)
- [Expo Go app](https://expo.dev/go) installed on your Android or iOS device, OR an Android Studio Emulator / iOS Simulator.

### Installation
```bash
# Clone the repository
git clone https://github.com/dhirajnavghare/sanatan.cc.react.native.git
cd sanatan.cc.react.native

# Install dependencies
npm install
```

### Running the App
```bash
# Start the Expo development server
npm start

# Run directly on active Android emulator / connected device
npx expo run:android

# Run on iOS Simulator (macOS only)
npx expo run:ios
```

---

## 🧪 Verification & Testing

Every pull request is automatically verified by GitHub Actions. You can run all verification gates locally:

```bash
npm run typecheck    # Strict TypeScript verification (npx tsc --noEmit)
npm test             # Run all 27 Jest test suites (189+ tests)
npm run test:coverage# Generate full code coverage breakdown
```

---

## 📁 Project Architecture

```
sanatan.cc.react.native/
├── app/                        # Expo Router Navigation & Screen Layouts
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom navigation tabs configuration
│   │   ├── index.tsx           # 🗓 दिनचर्या (Daily Routine & Day Planner)
│   │   ├── muhurta.tsx         # ✨ मुहूर्त (Shubh Muhurta Finder)
│   │   ├── festivals.tsx       # 🪔 पर्व-व्रत (Festivals & Fasts Timeline)
│   │   ├── prayers.tsx         # 📿 स्तोत्र-जाप (Sacred Prayers & Japa Mala)
│   │   └── more.tsx            # ⚙️ तीर्थ व अधिक (Tirthas & Settings)
│   ├── _layout.tsx             # Root navigation stack with Providers
│   └── modal.tsx               # Info modal
├── src/
│   ├── core/                   # 100% Offline Pure TypeScript Calculation Engines
│   │   ├── panchang/           # NASA JPL VSOP87 & Chapront ELP-2000 calculations
│   │   ├── muhurta-finder/     # Shastra algorithms & suitability scoring
│   │   ├── festivals/          # Annual timeline & metadata database
│   │   ├── prayers/            # Sacred text stotras & chalisas database
│   │   ├── temples/            # 31 pilgrimage sanctuaries database
│   │   ├── devatas/            # Vedic deities database
│   │   ├── vrat-katha/         # Sacred fast stories, fasting rules & parana guidance
│   │   ├── calendar/           # iCalendar (.ics) export generator
│   │   └── i18n/               # LanguageContext, translations & formatters
│   ├── services/               # State, audio, haptics & notifications services
│   ├── components/             # Reusable UI cards, modals, and tour spotlights
│   └── utils/                  # Tour geometry and fallback baselines
├── docs/                       # Developer guides & Play Store compliance
└── __tests__/                  # Comprehensive Jest test suites
```

---

## 🤝 Community & Contributing

We welcome contributions from developers, Sanskrit scholars, astronomers, and devotees around the world.

- Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.
- See our [Code of Conduct](CODE_OF_CONDUCT.md).
- Review our [Security Policy](SECURITY.md).
- Check the [Developer Commands Guide](docs/developer-guide.md).
- Review [Google Play Compliance & Non-Trader Audit](docs/google-play-compliance.md).

---

## 📜 License
This project is free and unencumbered software released into the public domain under [The Unlicense](LICENSE).
