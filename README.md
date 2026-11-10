# Sanatan.cc React Native (Android & iOS)

A 100% offline-first, mathematically authentic Vedic Panchang, Shubh Muhurta, Festival Calendar, and Sacred Prayers mobile application built with **React Native (Expo SDK 58)** and pure TypeScript ephemeris calculations.

---

## 🌟 Key Features

1. **100% Offline Standalone Calculation Engine:**
   - Powered by on-device implementations of NASA JPL VSOP87, Chapront ELP-2000, and spherical trigonometry.
   - Computes Tithi, Nakshatra, Yoga, Karana, Vara, Sunrise, Sunset, and 16 Choghadiyas in **< 1ms** on-device without internet.
2. **Shubh Muhurta Finder:**
   - Algorithmic discovery across 30 to 180 days for Griha Pravesh, Vivaha, Vehicle, Business, Property, and Gold purchase.
   - Evaluates Muhurta Chintamani shastra rules with Bhadra exclusions.
3. **Annual Festivals Timeline:**
   - 150+ chronological celebrations and fasts across 2025, 2026, and 2027.
4. **Sacred Prayers & Japa Counter:**
   - Verse-by-verse chanting with authentic Sanskrit Devanagari, transliteration, and spiritual meanings.
   - Built-in tactile 108-bead Japa Mala counter with repetition tracking.
5. **GPS Geolocation & Holy Tirthas:**
   - One-click GPS coordinate detection via `expo-location`.
   - Directory of 12 Jyotirlingas, 4 Char Dhams, and Pancha Bhootas with local darshan schedules.
6. **Strict Bilingual Support:**
   - Instant toggle between pure Hindi (हिन्दी) and English (EN).
   - Regional calendar support: Purnimanta (North India) vs. Amanta (West & South India).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- [Expo Go app](https://play.google.com/store/apps/details?id=host.exp.exponent) installed on your Android phone, OR an Android Studio Emulator.

### Installation
```bash
# Clone or navigate to the repository
cd sanatan.cc.react.native

# Install dependencies (already installed)
npm install
```

### Running the App

```bash
# Start the Expo development server
npm start

# Run directly on Android device or emulator
npm run android
```

1. Open the **Expo Go** app on your Android device.
2. Scan the QR code displayed in your terminal.
3. The app will bundle and open instantly on your phone!

---

## 📁 Project Architecture

```
sanatan.cc.react.native/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx    # Bottom navigation tabs configuration
│   │   ├── index.tsx      # 🗓 Daily Panchang & 5 Limbs Screen
│   │   ├── muhurta.tsx    # ✨ Shubh Muhurta Finder Screen
│   │   ├── festivals.tsx  # 🪔 Annual Festivals Timeline Screen
│   │   ├── prayers.tsx    # 📿 Sacred Prayers & 108 Japa Counter
│   │   └── more.tsx       # ⚙️ Temples & App Settings Screen
│   ├── _layout.tsx        # Root navigation stack with LanguageProvider
│   └── modal.tsx          # Info modal
├── src/
│   └── core/              # 100% Offline Pure TypeScript Calculation Engines
│       ├── panchang/      # NASA JPL VSOP87 & Chapront ELP-2000 calculations
│       ├── muhurta-finder/# Shastra algorithms & suitability scoring
│       ├── festivals/     # Annual timeline & metadata database
│       ├── prayers/       # Sacred text stotras & chalisas database
│       ├── temples/       # 31 pilgrimage sanctuaries database
│       ├── devatas/       # Vedic deities database
│       └── i18n/          # LanguageContext, translations & formatters
├── constants/
│   └── Colors.ts          # Spiritual amber/saffron and temple dark themes
└── app.json               # Expo configuration & Android permissions
```

---

## 📜 License
This project is dedicated to the public domain under the **Creative Commons CC0 1.0 Universal / Unlicense**.
