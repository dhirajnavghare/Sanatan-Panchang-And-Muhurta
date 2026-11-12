import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import PanchangScreen from '@/app/(tabs)/index';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { getCurrentSpiritualPeriod } from '@/src/services/dinacharya';

describe('UI, Button & Layout Invariants Test Suite (Visual & Layout Regressions)', () => {
  afterEach(() => {
    cleanup();
  });

  const renderScreen = async () => {
    const utils = await render(
      <LanguageProvider>
        <PanchangScreen />
      </LanguageProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    return utils;
  };

  describe('Greeting Grammar & Duplication Invariant', () => {
    it('should NEVER duplicate devotee name or title in greeting (e.g. no "साधक, साधक")', async () => {
      await renderScreen();

      // Check all rendered texts on screen for stuttered duplicate names
      const allTexts = screen.getAllByText(/.+/);
      for (const el of allTexts) {
        const textContent = el.props.children;
        if (typeof textContent === 'string') {
          // Reject duplicate words like "साधक, साधक" or "Sadhak, Sadhak"
          expect(textContent).not.toMatch(/(साधक|Sadhak)[,\s]+\1/i);
        }
      }
    });

    it('should provide authentic non-duplicated greetings from getCurrentSpiritualPeriod', () => {
      const nowMorning = new Date('2026-11-11T08:30:00+05:30');
      const sunrise = new Date('2026-11-11T06:37:00+05:30');
      const sunset = new Date('2026-11-11T17:44:00+05:30');

      const morningPeriod = getCurrentSpiritualPeriod(nowMorning, sunrise, sunset);
      expect(morningPeriod.greetingHi).toBe('शुभ प्रभात');
      expect(morningPeriod.greetingEn).toBe('Good Morning');

      // Verify no duplicate "साधक" hardcoded inside the greeting string itself
      expect(morningPeriod.greetingHi).not.toContain('साधक');
      expect(morningPeriod.greetingEn).not.toContain('Sadhak');
    });
  });

  describe('Button Dimensions, Usability & Layout Invariants', () => {
    it('should render Daily Sadhana Modal save button with accessible height and non-black background', async () => {
      await renderScreen();

      // Open the Sadhana Checklist modal
      const heroChallengeCard = screen.getByTestId('hero-challenge-card');
      await act(async () => {
        fireEvent.press(heroChallengeCard);
      });

      // Target the save button inside the modal
      const saveBtn = screen.getByTestId('sadhana-save-btn');
      expect(saveBtn).toBeTruthy();

      // Style assertions on the actual rendered button
      const buttonStyle = Array.isArray(saveBtn.props.style)
        ? Object.assign({}, ...saveBtn.props.style)
        : saveBtn.props.style || {};

      // 1. Invariant: Accessible touch target height (minimum 44px as per Apple/Material guidelines)
      const minHeight = buttonStyle.minHeight || buttonStyle.height;
      expect(minHeight).toBeGreaterThanOrEqual(44);

      // 2. Invariant: Must NOT be pitch black '#18181b' or black glitch
      expect(buttonStyle.backgroundColor).not.toBe('#18181b');
      expect(buttonStyle.backgroundColor).not.toBe('#000000');
      expect(buttonStyle.backgroundColor).not.toBe('black');

      // 3. Invariant: Must NOT have flex: 1 that squashes the button in a vertical modal
      expect(buttonStyle.flex).toBeUndefined();

      // 4. Invariant: Button text must exist and have high contrast color (#ffffff)
      const saveBtnText = screen.getByText(/साधना सहेजें|Save Sadhana/i);
      expect(saveBtnText).toBeTruthy();

      const textStyle = Array.isArray(saveBtnText.props.style)
        ? Object.assign({}, ...saveBtnText.props.style)
        : saveBtnText.props.style || {};
      expect(textStyle.color).toBe('#ffffff');
    });

    it('should style the active calendar week day pill with Kesariya/Amber instead of jet-black', async () => {
      await renderScreen();

      // Active day pill in week selector
      const activePill = screen.getByTestId('day-pill-selected');
      expect(activePill).toBeTruthy();

      const pillStyle = Array.isArray(activePill.props.style)
        ? Object.assign({}, ...activePill.props.style)
        : activePill.props.style || {};

      // Invariant: Must not be pitch-black '#18181b'
      expect(pillStyle.backgroundColor).not.toBe('#18181b');
      expect(pillStyle.backgroundColor).toBe('#b45309');
    });

    it('should style Day Planner active tabs with warm saffron/amber instead of jet-black', async () => {
      await renderScreen();

      const coreTab = screen.getByTestId('planner-tab-core');
      expect(coreTab).toBeTruthy();

      const tabStyle = Array.isArray(coreTab.props.style)
        ? Object.assign({}, ...coreTab.props.style)
        : coreTab.props.style || {};

      // Invariant: Must not be pitch-black '#18181b'
      expect(tabStyle.backgroundColor).not.toBe('#18181b');
      expect(tabStyle.backgroundColor).toBe('#b45309');
    });
  });
});
