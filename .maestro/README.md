# Maestro Real-Device E2E Flows

All end-to-end flows target `appId: cc.sanatan.app`.

## Included Flows
- `01-onboarding-tour.yaml` — Fresh install first-time welcome slides, Live Interactive Guided Tour launch, cross-tab jumps (`muhurta`, `community`), Try Mode toggle, and skip confirmation.
- `02-dinacharya-planner.yaml` — Daily Panchang home, Mandir Bell audio button, Day Planner task entry, Monthly Calendar tab, Daily Shloka modal navigation.
- `03-muhurta-festivals.yaml` — Muhurta category/horizon/suitability filters, contextual help modal, Festivals search & Ekadashi filter.
- `04-prayers-more.yaml` — Prayers selection, Temple Bell/audio controls, Japa Mala 108 goal, font zoom, Temples/Deities/Vrat Kathas, About screen.
- `05-community-settings.yaml` — Project Hub segment tabs, feedback & issue validation errors, language toggle, Meridian modal, Pradosh/Chandrodaya notification toggles, Tour replay.
- `visual-screenshots.yaml` — Captures screenshots for real-device pixel regression comparisons via `node scripts/visual-diff-png.js`.

## Running Locally
Requires a built debug/preview binary installed on an Android emulator or iOS Simulator plus Maestro CLI installed:
```bash
maestro test .maestro/01-onboarding-tour.yaml
maestro test .maestro/
```
