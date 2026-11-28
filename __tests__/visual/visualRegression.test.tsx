import React from 'react';
import * as ReactNative from 'react-native';
import { Dimensions, PixelRatio, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, cleanup, act } from '@testing-library/react-native';
import * as appColorSchemeMod from '@/components/useColorScheme';
import PanchangScreen from '@/app/(tabs)/index';
import MuhurtaScreen from '@/app/(tabs)/muhurta';
import FestivalsScreen from '@/app/(tabs)/festivals';
import PrayersScreen from '@/app/(tabs)/prayers';
import MoreScreen from '@/app/(tabs)/more';
import CommunityScreen from '@/app/(tabs)/community';
import SettingsScreen from '@/app/(tabs)/settings';
import AboutModalScreen from '@/app/modal';
import NotFoundScreen from '@/app/+not-found';
import { AppTourModal } from '@/src/components/AppTourModal';
import { DailyPanchangCardModal } from '@/src/components/DailyPanchangCardModal';
import { SacredProfileEditorModal } from '@/src/components/SacredProfileEditorModal';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { TourProvider } from '@/src/services/appTourContext';
import { calculatePanchang, PRESET_CITIES } from '@/src/core/panchang';
import { SACRED_DAILY_VERSES, WEEKDAY_DEVATAS } from '@/src/services/dinacharya';
import { DEFAULT_USER_PROFILE } from '@/src/services/userProfile';
import { markAppTourCompleted } from '@/src/services/appTour';
import { baselineExists, getBaselinePath, readBaseline, writeBaseline } from '../../scripts/visual-baseline-store';

const ALLOW_BASELINE_WRITE = process.env.UPDATE_VISUAL_BASELINES === '1';

const FIXED_DATE = new Date('2026-11-28T07:00:00.000Z');

interface SerializedNode {
  type: string;
  testID?: string;
  role?: string;
  style?: Record<string, unknown>;
  children?: (SerializedNode | string)[];
}

function sanitizeValue(val: unknown): unknown {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') return Number.isFinite(val) ? Number(val.toFixed(2)) : undefined;
  if (typeof val === 'string' || typeof val === 'boolean') return val;
  if (Array.isArray(val)) return val.map(sanitizeValue).filter((v) => v !== undefined);
  if (typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(val as Record<string, unknown>).sort()) {
      const sv = sanitizeValue((val as Record<string, unknown>)[k]);
      if (sv !== undefined) out[k] = sv;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return undefined;
}

function extractVisualTree(node: unknown): SerializedNode | string | null {
  if (node === null || node === undefined) return null;
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) {
    const items = node.map(extractVisualTree).filter(Boolean);
    return items.length === 1 ? (items[0] as SerializedNode | string) : null;
  }
  const obj = node as {
    type?: string;
    props?: Record<string, unknown>;
    children?: unknown[];
  };
  const props = obj.props || {};
  const pickedStyleKeys = [
    'backgroundColor',
    'borderColor',
    'borderRadius',
    'borderWidth',
    'color',
    'flexDirection',
    'flexWrap',
    'fontSize',
    'fontWeight',
    'gap',
    'minHeight',
    'opacity',
    'padding',
    'paddingHorizontal',
    'paddingVertical',
    'width',
  ];
  const flatStyle = props.style ? (StyleSheet.flatten(props.style as any) as Record<string, unknown>) : null;
  const style: Record<string, unknown> = {};
  if (flatStyle) {
    for (const key of pickedStyleKeys) {
      const val = sanitizeValue(flatStyle[key]);
      if (val !== undefined) style[key] = val;
    }
  }

  const children = (obj.children || [])
    .map(extractVisualTree)
    .filter((c): c is SerializedNode | string => c !== null);

  const out: SerializedNode = {
    type: String(obj.type || 'Unknown'),
  };
  if (typeof props.testID === 'string') out.testID = props.testID;
  if (typeof props.accessibilityRole === 'string') out.role = props.accessibilityRole;
  if (Object.keys(style).length > 0) out.style = style;
  if (children.length > 0) out.children = children;
  return out;
}

function assertMatchesVisualBaseline(baselineName: string, treeJson: unknown): void {
  const normalized = extractVisualTree(treeJson);
  const serialized = JSON.stringify(normalized, null, 2) + '\n';

  if (!baselineExists(baselineName)) {
    if (ALLOW_BASELINE_WRITE) {
      writeBaseline(baselineName, serialized);
      return;
    }
    throw new Error(
      `Missing approved visual baseline: ${getBaselinePath(baselineName)}. Run "npm run test:visual:update" to review and record intentional UI changes.`
    );
  }

  if (ALLOW_BASELINE_WRITE) {
    writeBaseline(baselineName, serialized);
    return;
  }

  const expected = readBaseline(baselineName);
  if (expected !== serialized) {
    // Never auto-overwrite baselines on mismatch! Fail loudly so regressions are investigated.
    expect(serialized).toBe(expected);
  }
}

describe('Automated Visual Regression & Multi-Viewport Baseline Suite', () => {
  const originalFetch = globalThis.fetch;
  let colorSchemeSpy: jest.SpyInstance;
  let appColorSchemeSpy: jest.SpyInstance;
  let fontScaleSpy: jest.SpyInstance;
  let windowDimsSpy: jest.SpyInstance;

  const setViewport = (width: number, height: number, scheme: 'light' | 'dark', fontScale = 1) => {
    colorSchemeSpy?.mockRestore();
    appColorSchemeSpy?.mockRestore();
    fontScaleSpy?.mockRestore();
    windowDimsSpy?.mockRestore();
    colorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);
    appColorSchemeSpy = jest.spyOn(appColorSchemeMod, 'useColorScheme').mockReturnValue(scheme);
    fontScaleSpy = jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(fontScale);
    windowDimsSpy = jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width,
      height,
      scale: 2,
      fontScale,
    });
    Dimensions.set({
      window: { width, height, scale: 2, fontScale },
      screen: { width, height, scale: 2, fontScale },
    });
  };

  beforeAll(() => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'clearImmediate'],
    });
    jest.setSystemTime(FIXED_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    jest.setSystemTime(FIXED_DATE);
    await AsyncStorage.clear();
    await markAppTourCompleted();
    setViewport(390, 844, 'light', 1);
    globalThis.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('changelog')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            releases_count: 1,
            changelog: [
              {
                id: 1,
                title: 'v2.0 Visual Baseline Release',
                description: 'Consistent typography, contrast & responsive layouts',
                completed_at: '2026-11-28T00:00:00Z',
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          total_contributors: 1,
          contributors: [
            {
              id: 1,
              user_id: 1,
              name: 'Sanatan Seva Team',
              role_in_project: 'Maintainers',
              joined_at: '2025-01-01T00:00:00Z',
              contributions: {
                stories_assigned: 10,
                stories_completed: 10,
                story_points_completed: 30,
                issues_assigned: 4,
                issues_resolved: 4,
                issues_reported: 2,
              },
            },
          ],
        }),
      };
    });
  });

  afterEach(async () => {
    await cleanup();
    colorSchemeSpy?.mockRestore();
    appColorSchemeSpy?.mockRestore();
    fontScaleSpy?.mockRestore();
    windowDimsSpy?.mockRestore();
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const renderSettled = async (element: React.ReactElement, ms = 120) => {
    const result = await render(element);
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
    return result;
  };

  it.each<[string, 'light' | 'dark', number, number, number]>([
    ['home-standard-light', 'light', 390, 844, 1],
    ['home-small-dark', 'dark', 320, 568, 1],
    ['home-tablet-largefont', 'light', 768, 1024, 1.5],
  ])('matches approved visual baseline for Dinacharya Home (%s)', async (name, scheme, w, h, fontScale) => {
    setViewport(w, h, scheme, fontScale);
    const tree = await renderSettled(
      <LanguageProvider>
        <TourProvider>
          <PanchangScreen />
        </TourProvider>
      </LanguageProvider>
    );
    assertMatchesVisualBaseline(name, tree.toJSON());
  });

  it('matches approved visual baselines for Muhurta (compact light & standard dark)', async () => {
    setViewport(320, 568, 'light', 1);
    const compactTree = await renderSettled(
      <LanguageProvider>
        <TourProvider>
          <MuhurtaScreen />
        </TourProvider>
      </LanguageProvider>,
      100
    );
    assertMatchesVisualBaseline('muhurta-compact-light', compactTree.toJSON());
    await cleanup();

    setViewport(390, 844, 'dark', 1);
    const darkTree = await renderSettled(
      <LanguageProvider>
        <TourProvider>
          <MuhurtaScreen />
        </TourProvider>
      </LanguageProvider>,
      100
    );
    assertMatchesVisualBaseline('muhurta-standard-dark', darkTree.toJSON());
  });

  it.each<[string, () => React.ReactElement, 'light' | 'dark', number, number]>([
    ['festivals-standard-light', () => <FestivalsScreen />, 'light', 390, 844],
    ['prayers-standard-dark', () => <PrayersScreen />, 'dark', 390, 844],
    ['more-tablet-light', () => <MoreScreen />, 'light', 768, 1024],
    ['community-standard-light', () => <CommunityScreen />, 'light', 390, 844],
    ['settings-standard-dark', () => <SettingsScreen />, 'dark', 390, 844],
  ])(
    'matches approved visual baseline for %s',
    async (name, renderScreen, scheme, w, h) => {
      setViewport(w, h, scheme, 1);
      const rendered = await renderSettled(
        <LanguageProvider>
          <TourProvider>{renderScreen()}</TourProvider>
        </LanguageProvider>,
        120
      );
      assertMatchesVisualBaseline(name, rendered.toJSON());
    },
    15000
  );

  it('matches approved visual baselines for standalone routes & modal sheets (light + dark)', async () => {
    setViewport(390, 844, 'light', 1);
    const aboutTree = await renderSettled(
      <LanguageProvider>
        <AboutModalScreen />
      </LanguageProvider>
    );
    assertMatchesVisualBaseline('modal-about-light', aboutTree.toJSON());
    await cleanup();

    setViewport(320, 568, 'dark', 1.3);
    const notFoundTree = await renderSettled(
      <LanguageProvider>
        <NotFoundScreen />
      </LanguageProvider>
    );
    assertMatchesVisualBaseline('not-found-compact-dark', notFoundTree.toJSON());
    await cleanup();

    setViewport(390, 844, 'dark', 1);
    const tourModalTree = await renderSettled(
      <LanguageProvider>
        <TourProvider>
          <AppTourModal visible={true} onClose={jest.fn()} isHi={false} />
        </TourProvider>
      </LanguageProvider>
    );
    assertMatchesVisualBaseline('app-tour-modal-dark', tourModalTree.toJSON());
    await cleanup();

    const samplePanchang = calculatePanchang(FIXED_DATE, PRESET_CITIES[0]);
    const shareCardTree = await renderSettled(
      <DailyPanchangCardModal
        visible={true}
        onClose={jest.fn()}
        panchang={samplePanchang}
        cityName={PRESET_CITIES[0].name}
        devataInfo={WEEKDAY_DEVATAS[FIXED_DATE.getDay()]}
        verse={SACRED_DAILY_VERSES[0]}
        userName="साधक"
      />
    );
    assertMatchesVisualBaseline('daily-panchang-share-card', shareCardTree.toJSON());
    await cleanup();

    const profileTree = await renderSettled(
      <SacredProfileEditorModal
        visible={true}
        onClose={jest.fn()}
        profile={DEFAULT_USER_PROFILE}
        onSave={jest.fn().mockResolvedValue(undefined)}
        isHi={false}
      />
    );
    assertMatchesVisualBaseline('sacred-profile-editor-light', profileTree.toJSON());
  });
});
