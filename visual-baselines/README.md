# Automated Visual Regression Testing

Visual regression protection uses two complementary layers:

1. **Deterministic Component & Multi-Viewport Structural/Style Baselines (`__tests__/visual/visualRegression.test.tsx`)**
   - Captures normalized layout trees, typography styles, color themes (Light + Dark), bilingual labels (Hindi + English), accessibility attributes, and viewport invariants across:
     - Small phone (`320x568`)
     - Standard phone (`390x844`)
     - Large phone with large font (`412x915`, `fontScale: 1.5`)
     - Tablet (`768x1024`)
   - Approved baselines are locked in `__tests__/visual/baselines/*.baseline.json`.
   - Baselines are **NEVER auto-updated** on mismatch.
   - To intentionally regenerate approved baselines after deliberate UI changes:
     ```bash
     npm run test:visual:update
     ```

2. **Real-Device PNG Screenshot Diffing (`scripts/visual-diff-png.js`)**
   - When Maestro runs `.maestro/visual-screenshots.yaml` against an emulator/simulator, approve verified PNGs into `visual-baselines/approved/` and compare candidate runs via:
     ```bash
     node scripts/visual-diff-png.js visual-baselines/current
     ```
