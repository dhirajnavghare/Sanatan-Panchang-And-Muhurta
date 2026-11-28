import {
  buildDayPlannerSlots,
  getLiveCosmicStatus,
  saveSlotPlan,
  toggleSlotCompletion,
  addTodoToSlot,
  toggleTodoItem,
  deleteTodoItem,
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

      // Verify strict continuity: every slot's endTime matches the next slot's startTime
      for (let i = 0; i < slots.length - 1; i++) {
        expect(slots[i].endTime.getTime()).toEqual(slots[i + 1].startTime.getTime());
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

    it('should support full multi-todo CRUD per slot', async () => {
      const dateKey = '2026-11-11';
      const slotId = 'brahma_muhurta';

      // 1. Add first task
      let plans = await addTodoToSlot(dateKey, slotId, 'ध्यान व प्राणायाम');
      expect(plans[slotId]?.todos?.length).toBe(1);
      expect(plans[slotId]?.todos?.[0].text).toBe('ध्यान व प्राणायाम');
      expect(plans[slotId]?.isCompleted).toBe(false);

      // 2. Add second task
      plans = await addTodoToSlot(dateKey, slotId, 'गीता स्वाध्याय');
      expect(plans[slotId]?.todos?.length).toBe(2);

      const todo1 = plans[slotId]!.todos![0];
      const todo2 = plans[slotId]!.todos![1];

      // 3. Toggle first task completion
      plans = await toggleTodoItem(dateKey, slotId, todo1.id);
      expect(plans[slotId]?.todos?.[0].isCompleted).toBe(true);
      expect(plans[slotId]?.todos?.[1].isCompleted).toBe(false);
      expect(plans[slotId]?.isCompleted).toBe(false); // only 1 of 2 done

      // 4. Toggle second task completion -> all complete
      plans = await toggleTodoItem(dateKey, slotId, todo2.id);
      expect(plans[slotId]?.isCompleted).toBe(true);

      // 5. Delete first task
      plans = await deleteTodoItem(dateKey, slotId, todo1.id);
      expect(plans[slotId]?.todos?.length).toBe(1);
      expect(plans[slotId]?.todos?.[0].text).toBe('गीता स्वाध्याय');

      // 6. Delete remaining task -> slot cleaned up
      plans = await deleteTodoItem(dateKey, slotId, todo2.id);
      expect(plans[slotId]).toBeUndefined();
    });
  });
});
