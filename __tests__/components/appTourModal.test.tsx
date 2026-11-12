import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { AppTourModal } from '@/src/components/AppTourModal';
import {
  hasSeenAppTour,
  markAppTourCompleted,
  resetAppTour,
} from '@/src/services/appTour';

describe('App Tour Modal Component & Service Tests', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    await resetAppTour();
  });

  describe('App Tour Storage Service', () => {
    it('should return false initially when tour has never been seen', async () => {
      const seen = await hasSeenAppTour();
      expect(seen).toBe(false);
    });

    it('should mark tour as completed and persist state', async () => {
      await markAppTourCompleted();
      const seen = await hasSeenAppTour();
      expect(seen).toBe(true);
    });

    it('should reset tour state when requested', async () => {
      await markAppTourCompleted();
      expect(await hasSeenAppTour()).toBe(true);
      await resetAppTour();
      expect(await hasSeenAppTour()).toBe(false);
    });
  });

  describe('AppTourModal UI Flow', () => {
    it('should not render anything when visible is false', async () => {
      await render(
        <AppTourModal visible={false} onClose={jest.fn()} isHi={true} />
      );
      expect(screen.queryByTestId('app-tour-modal')).toBeNull();
    });

    it('should render the first slide with welcome information in Hindi', async () => {
      await render(
        <AppTourModal visible={true} onClose={jest.fn()} isHi={true} />
      );

      expect(screen.getByTestId('app-tour-modal')).toBeTruthy();
      expect(screen.getByText('सनातन दिनचर्या में आपका स्वागत है')).toBeTruthy();
      expect(screen.getByText(/चरण 1 \/ 5/i)).toBeTruthy();
      expect(screen.getByTestId('tour-skip-btn')).toBeTruthy();
      expect(screen.getByTestId('tour-next-btn')).toBeTruthy();
    });

    it('should advance through all 5 slides upon clicking Next', async () => {
      await render(
        <AppTourModal visible={true} onClose={jest.fn()} isHi={true} />
      );

      // Slide 1 -> 2
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      expect(screen.getByText('मुहूर्त आधारित दिनचर्या व To-Do सूची')).toBeTruthy();
      expect(screen.getByText(/चरण 2 \/ 5/i)).toBeTruthy();

      // Slide 2 -> 3
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      expect(screen.getByText('दैनिक नित्यकर्म साधना व गोत्र सङ्कल्प')).toBeTruthy();
      expect(screen.getByText(/चरण 3 \/ 5/i)).toBeTruthy();

      // Slide 3 -> 4
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      expect(screen.getByText('मन्दिर पीतल घंटी एवं पञ्चाङ्ग शेयर कार्ड')).toBeTruthy();
      expect(screen.getByText(/चरण 4 \/ 5/i)).toBeTruthy();

      // Slide 4 -> 5 (Final)
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      expect(screen.getByText(/दैनिक सहायक अनुभाग/)).toBeTruthy();
      expect(screen.getByText(/चरण 5 \/ 5/i)).toBeTruthy();
      expect(screen.getByTestId('tour-finish-btn')).toBeTruthy();
    });

    it('should allow going back to previous slide', async () => {
      await render(
        <AppTourModal visible={true} onClose={jest.fn()} isHi={true} />
      );

      // Advance to step 2
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      expect(screen.getByText(/चरण 2 \/ 5/i)).toBeTruthy();

      // Go back to step 1
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-back-btn'));
      });
      expect(screen.getByText(/चरण 1 \/ 5/i)).toBeTruthy();
      expect(screen.getByText('सनातन दिनचर्या में आपका स्वागत है')).toBeTruthy();
    });

    it('should call onClose when Skip is pressed', async () => {
      const onClose = jest.fn();
      await render(
        <AppTourModal visible={true} onClose={onClose} isHi={true} />
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-skip-btn'));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Finish button is pressed on last slide', async () => {
      const onClose = jest.fn();
      await render(
        <AppTourModal visible={true} onClose={onClose} isHi={false} />
      );

      // Advance to last slide (slide 5)
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-next-btn'));
      });

      const finishBtn = screen.getByTestId('tour-finish-btn');
      await act(async () => {
        fireEvent.press(finishBtn);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
