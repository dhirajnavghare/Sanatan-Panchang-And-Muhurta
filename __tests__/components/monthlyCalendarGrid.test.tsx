import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { MonthlyCalendarGrid } from '../../src/components/MonthlyCalendarGrid';
import { PRESET_CITIES } from '../../src/core/panchang';

describe('MonthlyCalendarGrid Component', () => {
  const ujjain = PRESET_CITIES[0];
  const testDate = new Date('2026-11-12T12:00:00Z');
  const onSelectDateMock = jest.fn();

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders correctly with week headers and days', async () => {
    await render(
      <MonthlyCalendarGrid
        currentDate={testDate}
        onSelectDate={onSelectDateMock}
        location={ujjain}
        isHi={true}
      />
    );

    // Weekday headers in Hindi
    expect(screen.getByText('रवि')).toBeTruthy();
    expect(screen.getByText('सोम')).toBeTruthy();
    expect(screen.getByText('मंगल')).toBeTruthy();

    // Today pill and navigation buttons
    expect(screen.getByTestId('month-nav-prev')).toBeTruthy();
    expect(screen.getByTestId('month-nav-next')).toBeTruthy();
    expect(screen.getByTestId('month-nav-today')).toBeTruthy();
  });

  it('calls onSelectDate when a day cell is pressed', async () => {
    await render(
      <MonthlyCalendarGrid
        currentDate={testDate}
        onSelectDate={onSelectDateMock}
        location={ujjain}
        isHi={true}
      />
    );

    // Day 15 cell
    const cell15 = screen.getByTestId('calendar-cell-15');
    expect(cell15).toBeTruthy();
    await act(async () => {
      fireEvent.press(cell15);
    });

    expect(onSelectDateMock).toHaveBeenCalled();
  });

  it('navigates to next and previous months without errors', async () => {
    await render(
      <MonthlyCalendarGrid
        currentDate={testDate}
        onSelectDate={onSelectDateMock}
        location={ujjain}
        isHi={false}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('month-nav-next'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('month-nav-prev'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('month-nav-today'));
    });

    expect(onSelectDateMock).toHaveBeenCalled();
  });
});
