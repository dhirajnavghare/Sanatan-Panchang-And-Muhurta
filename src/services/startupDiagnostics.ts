/**
 * Sanatan Startup Diagnostics & Invariant Test Engine
 *
 * Runs comprehensive automated verification of all core engines at app startup:
 * 1. Astronomical ephemeris & Sun/Moon rise calculations
 * 2. Panchanga Invariants (Tithi 1-30, Nakshatra 1-27, Yoga 1-27, Karana 1-60, Samvat)
 * 3. Muhurta & Choghadiya Engines (Brahma Muhurta, Rahu Kaal, 16 Choghadiyas)
 * 4. Shastric Muhurta Finder Categories & Special Yogas
 * 5. Festivals & Vrats Engine
 * 6. Day Planner & Real-Time Cosmic Pulse
 * 7. Dinacharya, Daily Sankalpa & Sadhana Habits
 * 8. User Profile, Vedic Gotra Registry & Sacred Audio/Notifications
 */

import { calculatePanchang, PRESET_CITIES } from '../core/panchang';
import { MUHURTA_CATEGORIES } from '../core/muhurta-finder';
import { calculateUpcomingFestivals } from '../core/panchang/festivals';
import { buildDayPlannerSlots, getLiveCosmicStatus } from './dayplanner';
import {
  WEEKDAY_DEVATAS,
  SACRED_DAILY_VERSES,
  generateDailySankalpa,
  getCurrentSpiritualPeriod,
} from './dinacharya';
import { DAILY_SADHANA_HABITS } from './sadhana';
import {
  DEFAULT_USER_PROFILE,
  POPULAR_GOTRAS,
  POPULAR_ISHTA_DEVATAS,
} from './userProfile';

export interface DiagnosticResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface DiagnosticReport {
  timestamp: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDurationMs: number;
  results: DiagnosticResult[];
}

// In-memory record of the last diagnostic run
let lastReport: DiagnosticReport | null = null;

export function getLastDiagnosticReport(): DiagnosticReport | null {
  return lastReport;
}

/**
 * Executes the complete diagnostic suite.
 * Can be run asynchronously at startup or on demand.
 */
export async function runStartupDiagnostics(): Promise<DiagnosticReport> {
  const startTime = Date.now();
  const results: DiagnosticResult[] = [];

  function record(suiteName: string, testName: string, fn: () => void) {
    const t0 = Date.now();
    try {
      fn();
      results.push({
        suiteName,
        testName,
        passed: true,
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      results.push({
        suiteName,
        testName,
        passed: false,
        durationMs: Date.now() - t0,
        error: err?.message || String(err),
      });
    }
  }

  // 1. ASTRONOMICAL EPHEMERIS & SUN/MOON TIMES
  const ujjain = PRESET_CITIES.find((c) => c.name === 'Ujjain') || PRESET_CITIES[0];
  const now = new Date();
  let panchangSample: any = null;

  record('Astronomical Engine', 'Preset Cities Validity', () => {
    if (!PRESET_CITIES || PRESET_CITIES.length < 5) {
      throw new Error(`Insufficient preset cities: found ${PRESET_CITIES?.length}`);
    }
    const hasUjjain = PRESET_CITIES.some((c) => c.name.includes('Ujjain'));
    if (!hasUjjain) throw new Error('Ujjain (Avanti Prime Meridian) missing from preset cities');
  });

  record('Astronomical Engine', 'Panchang Calculation for Ujjain', () => {
    panchangSample = calculatePanchang(now, ujjain, 'Lahiri', now, {
      includeUpcomingFestivals: true,
      includeFestivals: true,
    });
    if (!panchangSample) throw new Error('calculatePanchang returned null/undefined');
  });

  record('Astronomical Engine', 'Sunrise and Sunset Physical Invariants', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const { sunrise, sunset, solarNoon } = panchangSample.sunTimes;
    if (!(sunrise instanceof Date) || !(sunset instanceof Date)) {
      throw new Error('Sunrise or sunset is not a valid Date instance');
    }
    if (sunset.getTime() <= sunrise.getTime()) {
      throw new Error(`Sunset (${sunset.toISOString()}) must be after Sunrise (${sunrise.toISOString()})`);
    }
    const dayHours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
    if (dayHours < 9 || dayHours > 15) {
      throw new Error(`Day duration ${dayHours.toFixed(2)}h is outside physical bounds [9h, 15h]`);
    }
    if (solarNoon && (solarNoon.getTime() <= sunrise.getTime() || solarNoon.getTime() >= sunset.getTime())) {
      throw new Error('Solar noon must occur between Sunrise and Sunset');
    }
  });

  // 2. PANCHANGA 5-LIMB INVARIANTS
  record('Panchanga Invariants', 'Tithi Mathematical Bounds', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const tithi = panchangSample.tithi.current;
    if (tithi.index < 1 || tithi.index > 30) {
      throw new Error(`Tithi index ${tithi.index} out of Shastric range [1, 30]`);
    }
    if (tithi.pakshaIndex < 1 || tithi.pakshaIndex > 15) {
      throw new Error(`Paksha index ${tithi.pakshaIndex} out of range [1, 15]`);
    }
    if (tithi.paksha !== 'Shukla' && tithi.paksha !== 'Krishna') {
      throw new Error(`Invalid paksha: ${tithi.paksha}`);
    }
    if (!tithi.name || !tithi.nameDevanagari) {
      throw new Error('Tithi name or Devanagari missing');
    }
  });

  record('Panchanga Invariants', 'Nakshatra Mathematical Bounds', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const nak = panchangSample.nakshatra.current;
    if (nak.index < 1 || nak.index > 27) {
      throw new Error(`Nakshatra index ${nak.index} out of range [1, 27]`);
    }
    if (!nak.name || !nak.nameDevanagari || !nak.lord) {
      throw new Error('Nakshatra name, Devanagari, or lord missing');
    }
  });

  record('Panchanga Invariants', 'Yoga and Karana Mathematical Bounds', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const yoga = panchangSample.yoga.current;
    if (yoga.index < 1 || yoga.index > 27) {
      throw new Error(`Yoga index ${yoga.index} out of range [1, 27]`);
    }
    const karana = panchangSample.karana.current;
    if (karana.index < 1 || karana.index > 60) {
      throw new Error(`Karana index ${karana.index} out of range [1, 60]`);
    }
    if (!karana.name || !karana.nameDevanagari) {
      throw new Error('Karana name or Devanagari missing');
    }
  });

  record('Panchanga Invariants', 'Samvat & Masa Calculations', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const { vikramSamvat, shakaSamvat } = panchangSample.samvat;
    if (vikramSamvat < 2080 || vikramSamvat > 2090) {
      throw new Error(`Vikram Samvat ${vikramSamvat} anomalous for year ${now.getFullYear()}`);
    }
    if (shakaSamvat < 1940 || shakaSamvat > 1955) {
      throw new Error(`Shaka Samvat ${shakaSamvat} anomalous for year ${now.getFullYear()}`);
    }
    if (vikramSamvat - shakaSamvat !== 135) {
      throw new Error(`Vikram (${vikramSamvat}) - Shaka (${shakaSamvat}) must equal 135 years`);
    }
    if (!panchangSample.masa.amantaName || !panchangSample.masa.purnimantaName) {
      throw new Error('Masa calculation missing Amanta or Purnimanta system name');
    }
  });

  // 3. MUHURTA & CHOGHADIYA ENGINES
  record('Muhurta Engine', 'Brahma Muhurta Invariant', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const bm = panchangSample.muhurtas.brahmaMuhurta;
    if (!bm || !bm.startTime || !bm.endTime) {
      throw new Error('Brahma Muhurta missing or invalid');
    }
    const sunrise = panchangSample.sunTimes.sunrise;
    if (bm.endTime.getTime() > sunrise.getTime()) {
      throw new Error('Brahma Muhurta must end before or at Sunrise');
    }
    const durationMins = (bm.endTime.getTime() - bm.startTime.getTime()) / (1000 * 60);
    if (durationMins < 45 || durationMins > 52) {
      throw new Error(`Brahma Muhurta duration ${durationMins}m is outside 1-ghatika standard [45m, 52m]`);
    }
  });

  record('Muhurta Engine', 'Rahu Kaal & Inauspicious Intervals', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const rahu = panchangSample.muhurtas.rahuKaal;
    if (!rahu || !rahu.startTime || !rahu.endTime) {
      throw new Error('Rahu Kaal missing or invalid');
    }
    const { sunrise, sunset } = panchangSample.sunTimes;
    if (rahu.startTime.getTime() < sunrise.getTime() || rahu.endTime.getTime() > sunset.getTime()) {
      throw new Error('Rahu Kaal must occur entirely within daytime (Sunrise to Sunset)');
    }
    const durationMins = (rahu.endTime.getTime() - rahu.startTime.getTime()) / (1000 * 60);
    const dayMins = (sunset.getTime() - sunrise.getTime()) / (1000 * 60);
    const expectedMins = dayMins / 8;
    if (Math.abs(durationMins - expectedMins) > 2) {
      throw new Error(`Rahu Kaal duration (${durationMins.toFixed(1)}m) does not match 1/8 daytime (${expectedMins.toFixed(1)}m)`);
    }
  });

  record('Muhurta Engine', 'Choghadiya Sequence (16 periods: 8 Day + 8 Night)', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const { day, night } = panchangSample.choghadiya;
    if (!Array.isArray(day) || day.length !== 8) {
      throw new Error(`Day Choghadiyas count ${day?.length} !== 8`);
    }
    if (!Array.isArray(night) || night.length !== 8) {
      throw new Error(`Night Choghadiyas count ${night?.length} !== 8`);
    }
    const validNames = ['Amrit', 'Shubh', 'Labh', 'Char', 'Udveg', 'Rog', 'Kaal'];
    for (const ch of [...day, ...night]) {
      if (!validNames.includes(ch.name)) {
        throw new Error(`Invalid Choghadiya name: ${ch.name}`);
      }
    }
  });

  // 4. MUHURTA FINDER CATEGORIES & SPECIAL YOGAS
  record('Muhurta Finder', 'Vedic Categories Completeness', () => {
    if (!MUHURTA_CATEGORIES || MUHURTA_CATEGORIES.length < 6) {
      throw new Error(`Expected at least 6 Muhurta categories, found ${MUHURTA_CATEGORIES?.length}`);
    }
    const requiredIds = ['griha_pravesh', 'vivaha', 'vehicle_purchase', 'business_start', 'property_purchase', 'gold_purchase'];
    for (const reqId of requiredIds) {
      const exists = MUHURTA_CATEGORIES.some((c) => c.id === reqId);
      if (!exists) throw new Error(`Category ${reqId} missing from MUHURTA_CATEGORIES`);
    }
  });

  // 5. FESTIVALS ENGINE
  record('Festivals Engine', 'Upcoming Shastric Festivals Generation', () => {
    const festivals = calculateUpcomingFestivals(now, ujjain, 30);
    if (!Array.isArray(festivals)) {
      throw new Error('calculateUpcomingFestivals did not return an array');
    }
  });

  // 6. DAY PLANNER & REAL-TIME COSMIC STATUS
  record('Day Planner Engine', 'Slot Generation & Core Windows', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const slots = buildDayPlannerSlots(panchangSample);
    if (!Array.isArray(slots) || slots.length < 5) {
      throw new Error(`Expected at least 5 Day Planner slots, got ${slots?.length}`);
    }
    const hasCore = slots.some((s) => s.isCore);
    if (!hasCore) throw new Error('No core slots flagged in Day Planner');

    // Strict contiguous timeline validation: every slot's endTime matches the next slot's startTime
    for (let i = 0; i < slots.length - 1; i++) {
      if (slots[i].endTime.getTime() !== slots[i + 1].startTime.getTime()) {
        throw new Error(
          `Day Planner slot discontinuity between "${slots[i].title}" (${slots[i].endTime.toISOString()}) and "${slots[i + 1].title}" (${slots[i + 1].startTime.toISOString()})`
        );
      }
    }
  });

  record('Day Planner Engine', 'Live Cosmic Status Real-time Resolver', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const status = getLiveCosmicStatus(panchangSample, now);
    if (!status || !status.titleHi || !status.titleEn || !status.badgeBg) {
      throw new Error('Live Cosmic Status object missing required presentation properties');
    }
  });

  // 7. DINACHARYA, SANKALPA & SADHANA
  record('Dinacharya Engine', 'Weekday Devatas (7 Days)', () => {
    if (!WEEKDAY_DEVATAS) {
      throw new Error('WEEKDAY_DEVATAS is undefined');
    }
    const days = [0, 1, 2, 3, 4, 5, 6];
    for (const d of days) {
      const dev = WEEKDAY_DEVATAS[d];
      if (!dev || !dev.deityName || !dev.mantra || !dev.mantraDevanagari) {
        throw new Error(`Devata for day ${d} missing required attributes`);
      }
    }
  });

  record('Dinacharya Engine', 'Daily Personalized Vedic Sankalpa', () => {
    if (!panchangSample) throw new Error('Panchang sample not available');
    const testGotra = 'भारद्वाज';
    const testName = 'धिरज';
    const sankalpa = generateDailySankalpa(panchangSample, 'उज्जैन', testName, testGotra);
    if (!sankalpa.sanskrit.includes(testGotra)) {
      throw new Error(`Sanskrit Sankalpa missing user Gotra "${testGotra}"`);
    }
    if (!sankalpa.sanskrit.includes(testName)) {
      throw new Error(`Sanskrit Sankalpa missing user Name "${testName}"`);
    }
    if (!sankalpa.hindi || !sankalpa.english) {
      throw new Error('Sankalpa missing Hindi or English contemplation text');
    }
  });

  record('Sadhana Engine', 'Essential Micro-Habits (5 Habits)', () => {
    if (!DAILY_SADHANA_HABITS || DAILY_SADHANA_HABITS.length !== 5) {
      throw new Error(`Expected 5 Daily Sadhana Habits, found ${DAILY_SADHANA_HABITS?.length}`);
    }
  });

  // 8. USER PROFILE, GOTRAS & DEITIES
  record('Profile & Registry', 'Vedic Gotra List Completeness', () => {
    if (!POPULAR_GOTRAS || POPULAR_GOTRAS.length < 15) {
      throw new Error(`Expected at least 15 authentic Vedic Gotras, found ${POPULAR_GOTRAS?.length}`);
    }
    const sampleSubstrings = ['Kashyapa', 'Bharadvaja', 'Vashistha', 'Gautama'];
    for (const sub of sampleSubstrings) {
      const exists = POPULAR_GOTRAS.some((g) => g.includes(sub));
      if (!exists) {
        throw new Error(`Vedic Gotra containing "${sub}" missing from registry`);
      }
    }
  });

  record('Profile & Registry', 'Sacred Ishta Devata Completeness', () => {
    if (!POPULAR_ISHTA_DEVATAS || POPULAR_ISHTA_DEVATAS.length < 10) {
      throw new Error(`Expected at least 10 Ishta Devatas, found ${POPULAR_ISHTA_DEVATAS?.length}`);
    }
  });

  record('Profile & Registry', 'Default Profile Structure', () => {
    if (!DEFAULT_USER_PROFILE) throw new Error('DEFAULT_USER_PROFILE is undefined');
    if (typeof DEFAULT_USER_PROFILE.audioEnabled !== 'boolean') {
      throw new Error('DEFAULT_USER_PROFILE missing audioEnabled boolean');
    }
    if (typeof DEFAULT_USER_PROFILE.hapticsEnabled !== 'boolean') {
      throw new Error('DEFAULT_USER_PROFILE missing hapticsEnabled boolean');
    }
  });

  const totalDurationMs = Date.now() - startTime;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  const status: 'HEALTHY' | 'DEGRADED' | 'FAILED' =
    failedTests === 0 ? 'HEALTHY' : passedTests > 0 ? 'DEGRADED' : 'FAILED';

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    status,
    totalTests: results.length,
    passedTests,
    failedTests,
    totalDurationMs,
    results,
  };

  lastReport = report;

  // Pretty Console Diagnostic Output
  if (status === 'HEALTHY') {
    console.log(
      `\x1b[32m🕉️ [Sanatan Diagnostics] System HEALTHY: All ${passedTests}/${results.length} automated tests passed in ${totalDurationMs}ms.\x1b[0m`
    );
  } else {
    console.warn(
      `\x1b[33m⚠️ [Sanatan Diagnostics] System ${status}: ${passedTests}/${results.length} passed, ${failedTests} failed in ${totalDurationMs}ms.\x1b[0m`
    );
    for (const r of results.filter((r) => !r.passed)) {
      console.error(`  ❌ [${r.suiteName}] ${r.testName}: ${r.error}`);
    }
  }

  return report;
}
