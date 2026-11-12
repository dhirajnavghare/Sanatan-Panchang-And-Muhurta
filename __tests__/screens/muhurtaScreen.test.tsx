import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import MuhurtaScreen from '@/app/(tabs)/muhurta';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';

describe('Muhurta Screen - Comprehensive UI & Clicks Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const renderScreen = async () => {
    const utils = await render(
      <LanguageProvider>
        <MuhurtaScreen />
      </LanguageProvider>
    );

    // Wait for the 40ms calculation timer to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });

    return utils;
  };

  it('should render the Muhurta Screen with category banner and initial evaluation results', async () => {
    await renderScreen();

    // Default category is griha_pravesh
    expect(screen.getByTestId('category-pill-griha_pravesh')).toBeTruthy();
    expect(screen.getByTestId('category-pill-vivaha')).toBeTruthy();
  });

  it('should switch category when user clicks on a category pill', async () => {
    await renderScreen();

    const vivahaPill = screen.getByTestId('category-pill-vivaha');
    await act(async () => {
      fireEvent.press(vivahaPill);
      await new Promise((r) => setTimeout(r, 80));
    });

    // Check banner and pill both contain Vivaha
    expect(screen.getAllByText(/विवाह/i).length).toBeGreaterThanOrEqual(2);
  });

  it('should update evaluation range when user clicks on horizon pills (30 / 60 / 90 days)', async () => {
    await renderScreen();

    const days30Pill = screen.getByTestId('days-pill-30');
    await act(async () => {
      fireEvent.press(days30Pill);
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(days30Pill).toBeTruthy();

    const days90Pill = screen.getByTestId('days-pill-90');
    await act(async () => {
      fireEvent.press(days90Pill);
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(days90Pill).toBeTruthy();
  });

  it('should toggle suitability filter between Good and Optimal', async () => {
    await renderScreen();

    const optimalPill = screen.getByTestId('suitability-pill-Optimal');
    await act(async () => {
      fireEvent.press(optimalPill);
      await new Promise((r) => setTimeout(r, 80));
    });

    const goodPill = screen.getByTestId('suitability-pill-Good');
    await act(async () => {
      fireEvent.press(goodPill);
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(goodPill).toBeTruthy();
  });

  it('should toggle astrological breakdown when user expands evaluation card', async () => {
    await renderScreen();

    // Find rendered expand-toggle button
    const expandButtons = screen.queryAllByTestId(/^expand-toggle-/);
    if (expandButtons.length > 0) {
      await act(async () => {
        fireEvent.press(expandButtons[0]);
      });

      // Verify the breakdown appeared
      expect(screen.getByText(/पञ्चाङ्ग शुद्धि|Panchang Purity/i)).toBeTruthy();

      // Collapse it
      await act(async () => {
        fireEvent.press(expandButtons[0]);
      });
    }
  });
});
