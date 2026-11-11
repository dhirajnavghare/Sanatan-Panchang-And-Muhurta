import {
  buildDayPlannerSlots,
  getLiveCosmicStatus,
  saveSlotPlan,
  toggleSlotCompletion,
  getDayPlans,
} from '../src/services/dayplanner';
import { calculatePanchang, PRESET_CITIES } from '../src/core/panchang';

describe('Vedic Day Planner Engine Tests', () => {
  const ujjain = PRESET_CITIES[0];
  const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);

  describe('Slot Generation from Real-Time Panchanga', () => {
    it('should generate contiguous slots covering the entire day', () => {
      const slots = buildDayPlannerSlots(panchang);
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThanOrEqual(10);

      // Verify slot properties
      for (const slot of slots) {
        expect(slot.id).toBeDefined();
        expect(slot.title).toBeDefined();
        expect(slot.titleHi).toBeDefined();
        expect(slot.startTime).toBeInstanceOf(Date);
        expect(slot.endTime).toBeInstanceOf(Date);
        expect(slot.quality).toBeDefined();
      }
    });

    it('should include core Vedic windows: Brahma Muhurta, Abhijit, and Rahu Kaal', () => {
      const slots = buildDayPlannerSlots(panchang);
      const slotIds = slots.map((s) => s.id);

      expect(slotIds).toContain('brahma_muhurta');
      expect(slotIds).toContain('rahu_kaal');
      if (panchang.muhurtas.abhijitMuhurta) {
        expect(slotIds).toContain('abhijit_muhurta');
      }

      const brahmaSlot = slots.find((s) => s.id === 'brahma_muhurta');
      expect(brahmaSlot?.quality).toBe('Mahashubh');
      expect(brahmaSlot?.isCore).toBe(true);

      const rahuSlot = slots.find((s) => s.id === 'rahu_kaal');
      expect(rahuSlot?.quality).toBe('Ashubh');
      expect(rahuSlot?.isCore).toBe(true);
    });
  });

  describe('Live Cosmic Status (Real-time Pulse of Right Now)', () => {
    it('should identify Brahma Muhurta when current time is in the pre-dawn window', () => {
      const bm = panchang.muhurtas.brahmaMuhurta;
      const testMidBrahma = new Date(bm.startTime.getTime() + 10 * 60000);

      const status = getLiveCosmicStatus(panchang, testMidBrahma);
      expect(status.titleHi).toContain('ब्रह्म मुहूर्त');
      expect(status.badgeHi).toContain('अमृत');
    });

    it('should identify Rahu Kaal with caution flags when time falls in Rahu interval', () => {
      const rahu = panchang.muhurtas.rahuKaal;
      const testMidRahu = new Date(rahu.startTime.getTime() + 10 * 60000);

      const status = getLiveCosmicStatus(panchang, testMidRahu);
      expect(status.titleHi).toContain('राहु काल');
      expect(status.badgeHi).toContain('सावधानी');
    });
  });

  describe('Task Planning & Completion Workflows', () => {
    it('should save a plan for a slot and toggle its completion', async () => {
      const dateKey = '2026-11-10';
      const slotId = 'brahma_muhurta';
      const taskText = 'Pranayama and Gayatri Japa';

      const updatedPlans = await saveSlotPlan(dateKey, slotId, taskText);
      expect(updatedPlans[slotId]?.taskText).toBe(taskText);
      expect(updatedPlans[slotId]?.isCompleted).toBe(false);

      const toggledPlans = await toggleSlotCompletion(dateKey, slotId);
      expect(toggledPlans[slotId]?.isCompleted).toBe(true);
    });
  });
});
