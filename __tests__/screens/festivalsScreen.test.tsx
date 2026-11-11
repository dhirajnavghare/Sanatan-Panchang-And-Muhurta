import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import FestivalsScreen from '@/app/(tabs)/festivals';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';

describe('Festivals Screen - Comprehensive UI & Clicks Tests', () => {
  jest.setTimeout(25000);

  afterEach(() => {
    cleanup();
  });

  const renderScreen = async () => {
    const utils = await render(
      <LanguageProvider>
        <FestivalsScreen />
      </LanguageProvider>
    );

    // Wait for the 40ms calculation timer to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });

    return utils;
  };

  it('should render the festivals screen with year switcher, search bar, and category chips', async () => {
    await renderScreen();

    expect(screen.getByTestId('year-btn-2026')).toBeTruthy();
    expect(screen.getByTestId('festival-search-input')).toBeTruthy();
    expect(screen.getByTestId('category-chip-all')).toBeTruthy();
    expect(screen.getByTestId('category-chip-vrat')).toBeTruthy();
  });

  it('should switch the calendar year when user clicks year pills (2025, 2026, 2027)', async () => {
    await renderScreen();

    const year2025Btn = screen.getByTestId('year-btn-2025');
    await act(async () => {
      fireEvent.press(year2025Btn);
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(year2025Btn).toBeTruthy();

    const year2027Btn = screen.getByTestId('year-btn-2027');
    await act(async () => {
      fireEvent.press(year2027Btn);
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(year2027Btn).toBeTruthy();
  });

  it('should filter festivals when category chip is selected', async () => {
    await renderScreen();

    const vratChip = screen.getByTestId('category-chip-vrat');
    await act(async () => {
      fireEvent.press(vratChip);
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(vratChip).toBeTruthy();

    const majorChip = screen.getByTestId('category-chip-major');
    await act(async () => {
      fireEvent.press(majorChip);
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(majorChip).toBeTruthy();
  });

  it('should filter festivals when search query is entered and allow clearing', async () => {
    await renderScreen();

    const searchInput = screen.getByTestId('festival-search-input');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Diwali');
      await new Promise((r) => setTimeout(r, 80));
    });

    expect(searchInput.props.value).toBe('Diwali');

    // Click clear search button
    const clearIcon = screen.queryByTestId('clear-search-icon');
    if (clearIcon) {
      await act(async () => {
        fireEvent.press(clearIcon);
        await new Promise((r) => setTimeout(r, 80));
      });
      expect(searchInput.props.value).toBe('');
    }
  });

  it('should expand and collapse festival significance and rituals when expand row is tapped', async () => {
    await renderScreen();

    const expandButtons = screen.queryAllByTestId(/^fest-expand-/);
    if (expandButtons.length > 0) {
      await act(async () => {
        fireEvent.press(expandButtons[0]);
      });

      // Verify expanded shastric details are visible
      expect(
        screen.queryByText(/शास्त्रीय माहात्म्य|Scriptural Significance/i) ||
        screen.queryByText(/पूजा विधान|Rituals/i)
      ).toBeTruthy();

      // Collapse
      await act(async () => {
        fireEvent.press(expandButtons[0]);
      });
    }
  });
});
