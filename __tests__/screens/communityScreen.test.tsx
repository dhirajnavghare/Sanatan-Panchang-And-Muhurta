import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react-native';
import CommunityScreen from '@/app/(tabs)/community';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { TourProvider } from '@/src/services/appTourContext';
import { ContextualHelpModal } from '@/src/components/ContextualHelpModal';

describe('Community / Project Hub Screen Tests', () => {
  const originalFetch = globalThis.fetch;

  const renderCommunity = async () => {
    const utils = await render(
      <LanguageProvider>
        <TourProvider>
          <CommunityScreen />
          <ContextualHelpModal />
        </TourProvider>
      </LanguageProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('community-hero-card')).toBeTruthy();
      expect(screen.queryByTestId('changelog-refresh-btn') || screen.queryByTestId('changelog-error-card')).toBeTruthy();
    });
    return utils;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(async () => {
    await cleanup();
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('loads and displays releases changelog and contributors on mount', async () => {
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
                id: 42,
                title: 'v2.0 Interactive App Tour',
                description: 'Full 7-tab interactive guided onboarding',
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
              id: 7,
              user_id: 7,
              name: 'Dhiraj Navghare',
              role_in_project: 'Project Lead',
              joined_at: '2025-01-01T00:00:00Z',
              contributions: {
                stories_assigned: 24,
                stories_completed: 24,
                story_points_completed: 60,
                issues_assigned: 18,
                issues_resolved: 18,
                issues_reported: 5,
              },
            },
          ],
        }),
      };
    });

    await renderCommunity();

    await waitFor(() => {
      expect(screen.getByText('v2.0 Interactive App Tour')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('community-segment-contributors'));

    await waitFor(() => {
      expect(screen.getByText('Dhiraj Navghare')).toBeTruthy();
    });
  });

  it('displays bilingual offline error UI and recovers cleanly on Retry', async () => {
    let failMode = true;
    globalThis.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (failMode) {
        throw new TypeError('Network request failed');
      }
      if (String(url).includes('changelog')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            releases_count: 1,
            changelog: [{ id: 10, title: 'Recovered Release', description: 'OK', completed_at: '2026-11-28' }],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, total_contributors: 0, contributors: [] }),
      };
    });

    await renderCommunity();

    await waitFor(() => {
      expect(screen.getByTestId('changelog-error-card')).toBeTruthy();
    });

    failMode = false;
    await fireEvent.press(screen.getByTestId('changelog-retry-btn'));

    await waitFor(() => {
      expect(screen.getByText('Recovered Release')).toBeTruthy();
    });
  });

  it('validates and submits user feedback and issue reports with email checks', async () => {
    globalThis.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('changelog')) {
        return { ok: true, status: 200, json: async () => ({ success: true, releases_count: 0, changelog: [] }) };
      }
      if (String(url).includes('contributors')) {
        return { ok: true, status: 200, json: async () => ({ success: true, total_contributors: 0, contributors: [] }) };
      }
      if (String(url).includes('feedback')) {
        return { ok: true, status: 200, json: async () => ({ success: true, feedbackId: 505 }) };
      }
      return { ok: true, status: 200, json: async () => ({ success: true, issueId: 808 }) };
    });

    await renderCommunity();

    // Switch to Feedback tab
    await fireEvent.press(screen.getByTestId('community-segment-feedback'));

    await waitFor(() => {
      expect(screen.getByTestId('feedback-submit-btn')).toBeTruthy();
    });

    // Empty message validation
    await fireEvent.press(screen.getByTestId('feedback-submit-btn'));
    expect(screen.getByTestId('feedback-validation-error')).toBeTruthy();

    // Invalid email validation
    await fireEvent.changeText(screen.getByTestId('feedback-message-input'), 'Love the daily Panchang alerts!');
    await fireEvent.changeText(screen.getByTestId('feedback-email-input'), 'not-an-email');
    await fireEvent.press(screen.getByTestId('feedback-submit-btn'));
    expect(screen.getByTestId('feedback-validation-error')).toBeTruthy();

    // Select star rating, category, valid email & submit
    await fireEvent.press(screen.getByTestId('feedback-star-4'));
    await fireEvent.press(screen.getByTestId('feedback-category-praise'));
    await fireEvent.changeText(screen.getByTestId('feedback-email-input'), 'sadhak@sanatan.cc');
    await fireEvent.press(screen.getByTestId('feedback-submit-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('feedback-validation-error')).toBeNull();
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Switch to Issues tab and validate & submit issue
    await fireEvent.press(screen.getByTestId('community-segment-issues'));

    await waitFor(() => {
      expect(screen.getByTestId('issue-submit-btn')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('issue-submit-btn'));
    expect(screen.getByTestId('issue-validation-error')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('issue-title-input'), 'Panchang check');
    await fireEvent.changeText(screen.getByTestId('issue-description-input'), 'Verify sunset edge case');
    await fireEvent.changeText(screen.getByTestId('issue-email-input'), 'qa@sanatan.cc');
    await fireEvent.press(screen.getByTestId('issue-severity-high'));
    await fireEvent.press(screen.getByTestId('issue-submit-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('issue-validation-error')).toBeNull();
    });
  });

  it('opens contextual help modal for Community tab', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, releases_count: 0, changelog: [], total_contributors: 0, contributors: [] }),
    });

    await renderCommunity();

    await fireEvent.press(screen.getByTestId('community-help-btn'));

    expect(screen.getByTestId('contextual-help-modal')).toBeTruthy();
  });
});
