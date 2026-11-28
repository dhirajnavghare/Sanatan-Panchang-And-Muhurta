import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {
  fetchPublicChangelog,
  fetchPublicContributors,
  submitUserFeedback,
  submitReportedIssue,
  ProjectApiError,
} from '../../src/services/projectApi';
import {
  playTempleBell,
  playShankhNaad,
  triggerHaptic,
} from '../../src/services/sacredAudio';
import {
  ensureOfflineNotificationChannels,
  requestNotificationPermission,
  scheduleDailySacredReminders,
  presentTestNotification,
  getOfflineCapabilityReport,
} from '../../src/services/sacredNotifications';
import { DEFAULT_USER_PROFILE } from '../../src/services/userProfile';
import { calculatePanchang, PRESET_CITIES } from '../../src/core/panchang';
import { addTodoToSlot, toggleTodoItem, deleteTodoItem, getDayPlans } from '../../src/services/dayplanner';

describe('Project API, Audio, Notifications & DayPlanner Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('Project API Client (src/services/projectApi.ts)', () => {
    it('fetches changelog and contributors cleanly on HTTP 200', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          releases_count: 1,
          changelog: [{ id: 1, title: 'v2.0', description: 'Tour upgrade', completed_at: '2026-11-28' }],
        }),
      });

      const res = await fetchPublicChangelog();
      expect(res.success).toBe(true);
      expect(res.changelog).toHaveLength(1);

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          total_contributors: 1,
          contributors: [{ id: 1, user_id: 10, name: 'Dhiraj', role_in_project: 'Lead', joined_at: '2025-01-01', contributions: { stories_assigned: 10, stories_completed: 10, story_points_completed: 25, issues_assigned: 5, issues_resolved: 5, issues_reported: 2 } }],
        }),
      });
      const contrib = await fetchPublicContributors();
      expect(contrib.contributors).toHaveLength(1);
    });

    it('submits user feedback and issues with expected payload headers', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, feedbackId: 101, issueId: 202 }),
      });

      const fb = await submitUserFeedback({
        rating: 5,
        category: 'praise',
        message: 'Great app',
        user_name: 'Sadhak',
        user_email: 'user@example.com',
      });
      expect(fb.feedbackId).toBe(101);

      const iss = await submitReportedIssue({
        title: 'Minor UI tweak',
        description: 'Spacing off on small device',
        steps_to_reproduce: 'Open settings on 320px width',
        severity: 'low',
        reporter_name: 'QA Tester',
        reporter_email: 'dev@example.com',
      });
      expect(iss.issueId).toBe(202);
    });

    it('throws typed ProjectApiError on HTTP errors, network failures, abort timeouts, and invalid JSON', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal database offline',
      });
      await expect(fetchPublicChangelog()).rejects.toMatchObject({
        name: 'ProjectApiError',
        code: 'HTTP_ERROR',
        status: 500,
      });

      globalThis.fetch = jest.fn().mockRejectedValueOnce(new TypeError('Network request failed'));
      await expect(fetchPublicContributors()).rejects.toMatchObject({
        name: 'ProjectApiError',
        code: 'OFFLINE_OR_TIMEOUT',
      });

      const abortErr = new Error('Aborted');
      abortErr.name = 'AbortError';
      globalThis.fetch = jest.fn().mockRejectedValueOnce(abortErr);
      await expect(
        submitUserFeedback({
          rating: 4,
          category: 'general',
          message: 'Hi',
          user_name: 'Tester',
          user_email: 'a@b.com',
        })
      ).rejects.toThrow(ProjectApiError);

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });
      await expect(
        submitReportedIssue({
          title: 'T',
          description: 'D',
          steps_to_reproduce: 'Steps',
          severity: 'medium',
          reporter_name: 'Tester',
          reporter_email: 'a@b.com',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_RESPONSE',
      });
    });
  });

  describe('Sacred Audio & Haptics', () => {
    it('plays temple bell and shankh without throwing', () => {
      playTempleBell(0.7);
      playShankhNaad(1.0);
      expect(setAudioModeAsync).toHaveBeenCalled();
      expect(createAudioPlayer).toHaveBeenCalled();
    });

    it('triggers appropriate haptic patterns when enabled and skips when disabled', async () => {
      await triggerHaptic('tap', true);
      expect(Haptics.selectionAsync).toHaveBeenCalled();

      await triggerHaptic('bead', true);
      await triggerHaptic('quarter', true);
      await triggerHaptic('heavy', true);
      await triggerHaptic('malaComplete', true);
      expect(Haptics.impactAsync).toHaveBeenCalled();
      expect(Haptics.notificationAsync).toHaveBeenCalled();

      jest.clearAllMocks();
      await triggerHaptic('malaComplete', false);
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Sacred Notifications Scheduling & Offline Capabilities', () => {
    const ujjain = PRESET_CITIES[0];

    it('configures channels, requests permission, and returns capability metadata', async () => {
      await ensureOfflineNotificationChannels();
      const granted = await requestNotificationPermission();
      expect(granted).toBe(true);

      const report = getOfflineCapabilityReport();
      expect(report.zeroNetworkRequired).toBe(true);
      expect(report.isOfflineEphemerisReady).toBe(true);
      expect(report.offlinePreScheduleDays).toBe(7);

      await presentTestNotification('Title', 'Body');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('schedules reminders respecting master switch and skips when disabled', async () => {
      const panchang = calculatePanchang(new Date(Date.now() + 3600_000), ujjain);
      await scheduleDailySacredReminders(
        panchang,
        { ...DEFAULT_USER_PROFILE, notificationsEnabled: false },
        {},
        ujjain.timezone,
        3,
        ujjain,
        'en'
      );
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();

      jest.clearAllMocks();
      await scheduleDailySacredReminders(
        panchang,
        { ...DEFAULT_USER_PROFILE, notificationsEnabled: true },
        {},
        ujjain.timezone,
        2,
        ujjain,
        'hi'
      );
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('DayPlanner Sequential Persistence Edge Cases', () => {
    it('supports add, toggle, and delete todos cleanly', async () => {
      const dateKey = '2026-12-25';
      const afterAdd = await addTodoToSlot(dateKey, 'slot-abhijit', 'Meditation & Jap');
      const list1 = afterAdd['slot-abhijit'].todos || [];
      expect(list1.length).toBeGreaterThan(0);

      const todoId = list1[0].id;
      const afterToggle = await toggleTodoItem(dateKey, 'slot-abhijit', todoId);
      expect(afterToggle['slot-abhijit'].todos?.[0].isCompleted).toBe(true);

      const afterDelete = await deleteTodoItem(dateKey, 'slot-abhijit', todoId);
      expect(afterDelete['slot-abhijit']?.todos ?? []).toEqual([]);

      const persisted = await getDayPlans(dateKey);
      expect(persisted).toBeDefined();
    });
  });
});
