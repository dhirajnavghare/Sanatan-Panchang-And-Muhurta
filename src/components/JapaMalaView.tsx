import React, { useState } from 'react';
import { Animated, StyleSheet, View, Text, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic, playTempleBell } from '@/src/services/sacredAudio';
import { getAppTheme, MIN_TOUCH_TARGET } from '@/src/utils/theme';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

interface JapaMalaViewProps {
  mantraTitle: string;
  mantraDevanagari: string;
  mantraMeaning?: string;
  audioEnabled?: boolean;
  hapticsEnabled?: boolean;
  isHi?: boolean;
}

export function JapaMalaView({
  mantraTitle,
  mantraDevanagari,
  mantraMeaning,
  audioEnabled = true,
  hapticsEnabled = true,
  isHi = true,
}: JapaMalaViewProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const reduceMotion = useReducedMotion();
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [currentBead, setCurrentBead] = useState<number>(0);
  const [completedMalas, setCompletedMalas] = useState<number>(0);
  const [targetMalas, setTargetMalas] = useState<number>(1);
  const [milestoneMsg, setMilestoneMsg] = useState<string | null>(null);

  const runBeadPulse = () => {
    if (reduceMotion) return;
    pulseAnim.setValue(0.95);
    Animated.spring(pulseAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 45,
      bounciness: 6,
    }).start();
  };

  const handleBeadClick = () => {
    runBeadPulse();
    const nextBead = currentBead + 1;

    if (nextBead === 108) {
      setCurrentBead(0);
      setCompletedMalas((prev) => prev + 1);
      setMilestoneMsg(isHi ? '🙏 १०८ मनके पूर्ण! हरि ॐ' : '🙏 108 Beads Complete!');
      if (hapticsEnabled) triggerHaptic('malaComplete').catch(() => {});
      if (audioEnabled) playTempleBell(1.0);
    } else {
      setCurrentBead(nextBead);
      if (nextBead === 27 || nextBead === 54 || nextBead === 81) {
        setMilestoneMsg(isHi ? `✨ ${nextBead}/१०८ पड़ाव पूर्ण` : `✨ Milestone ${nextBead}/108 reached`);
        if (hapticsEnabled) triggerHaptic('quarter').catch(() => {});
      } else {
        if (milestoneMsg) setMilestoneMsg(null);
        if (hapticsEnabled) triggerHaptic('bead').catch(() => {});
      }
    }
  };

  const handleReset = () => {
    if (hapticsEnabled) triggerHaptic('tap').catch(() => {});
    setCurrentBead(0);
    setCompletedMalas(0);
    setMilestoneMsg(null);
  };

  const progressPercent = Math.round((currentBead / 108) * 100);
  const totalMantraCount = completedMalas * 108 + currentBead;

  return (
    <View
      style={[
        styles.cardContainer,
        isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
      ]}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.sacredBadge, isDark && { color: theme.primary }]}>
            {isHi ? '📿 पवित्र १०८ जप माला' : '📿 Sacred 108-Bead Japa Mala'}
          </Text>
          <Text style={[styles.mantraTitleText, isDark && { color: theme.text }]}>{mantraTitle}</Text>
        </View>
        <TouchableOpacity
          testID="japa-reset-btn"
          accessibilityRole="button"
          accessibilityLabel={isHi ? 'जप माला रीसेट करें' : 'Reset Japa counter'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.resetBtn,
            isDark && { backgroundColor: theme.cardMuted },
          ]}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={18} color={isDark ? theme.textSecondary : '#3f3f46'} />
          <Text style={[styles.resetBtnText, isDark && { color: theme.textSecondary }]}>
            {isHi ? 'रीसेट' : 'Reset'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mantra Display Box */}
      <View
        style={[
          styles.mantraBox,
          isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder, borderWidth: 1 },
        ]}
      >
        <Text style={[styles.mantraText, isDark && { color: theme.text }]}>{mantraDevanagari}</Text>
        {mantraMeaning ? (
          <Text style={[styles.mantraMeaningText, isDark && { color: theme.textSecondary }]}>
            {mantraMeaning}
          </Text>
        ) : null}
      </View>

      {/* Center Bead Counter & Interactive Visual */}
      <View style={styles.counterCenter}>
        <TouchableOpacity
          testID="bead-touch-zone"
          accessibilityRole="button"
          accessibilityLabel={
            isHi
              ? `मनका गिनें, वर्तमान ${currentBead} / १०८ मनके`
              : `Count Japa bead, currently ${currentBead} of 108`
          }
          accessibilityValue={{ min: 0, max: 108, now: currentBead }}
          style={styles.beadTouchZone}
          onPress={handleBeadClick}
          activeOpacity={0.85}
        >
          {/* Outer Ornamental Ring */}
          <Animated.View
            style={[
              styles.outerRing,
              isDark && { backgroundColor: theme.cardMuted, borderColor: theme.primaryBorder },
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View
              style={[
                styles.innerBeadCircle,
                isDark && { backgroundColor: theme.surface, borderColor: theme.primaryBorder, borderWidth: 2 },
              ]}
            >
              <Text testID="central-bead-number" style={[styles.beadNumber, isDark && { color: theme.text }]}>
                {currentBead}
              </Text>
              <Text style={[styles.beadTotal, isDark && { color: theme.textSecondary }]}>
                {isHi ? '/ १०८ मनके' : '/ 108 Beads'}
              </Text>
              <Text style={[styles.tapPrompt, isDark && { color: theme.primary }]}>
                {isHi ? 'जपने के लिए दबाएँ' : 'Tap to chant'}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
        {milestoneMsg ? (
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.milestoneToast,
              { backgroundColor: theme.successBg, borderColor: theme.successBorder },
            ]}
          >
            <Text style={[styles.milestoneToastText, { color: theme.successText }]}>{milestoneMsg}</Text>
          </View>
        ) : null}

        {/* Mala Progress Bar */}
        <View style={[styles.progressBarBg, isDark && { backgroundColor: theme.cardMuted }]}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.milestonesRow}>
          <Text style={[styles.milestoneText, isDark && { color: theme.textMuted }, currentBead >= 27 && styles.milestoneActive]}>
            {isHi ? '२७ (१/४)' : '27 (1/4)'}
          </Text>
          <Text style={[styles.milestoneText, isDark && { color: theme.textMuted }, currentBead >= 54 && styles.milestoneActive]}>
            {isHi ? '५४ (अर्ध)' : '54 (1/2)'}
          </Text>
          <Text style={[styles.milestoneText, isDark && { color: theme.textMuted }, currentBead >= 81 && styles.milestoneActive]}>
            {isHi ? '८१ (३/४)' : '81 (3/4)'}
          </Text>
          <Text style={[styles.milestoneText, isDark && { color: theme.textMuted }, currentBead === 108 && styles.milestoneActive]}>
            {isHi ? '१०८ (पूर्ण)' : '108 (Full)'}
          </Text>
        </View>
      </View>

      {/* Completed Malas Counter & Target Selector */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, isDark && { color: theme.text }]}>{completedMalas}</Text>
          <Text style={[styles.statLabel, isDark && { color: theme.textSecondary }]}>
            {isHi ? 'माला पूर्ण' : 'Malas Done'}
          </Text>
        </View>
        <View style={[styles.statBox, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, isDark && { color: theme.text }]}>{totalMantraCount}</Text>
          <Text style={[styles.statLabel, isDark && { color: theme.textSecondary }]}>
            {isHi ? 'कुल मन्त्र जप' : 'Total Chants'}
          </Text>
        </View>
        <View style={[styles.statBox, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, isDark && { color: theme.text }]}>{targetMalas}</Text>
          <Text style={[styles.statLabel, isDark && { color: theme.textSecondary }]}>
            {isHi ? 'दैनिक लक्ष्य' : 'Daily Goal'}
          </Text>
        </View>
      </View>

      {/* Target Selector Pills */}
      <View style={[styles.targetSelectorRow, isDark && { borderTopColor: theme.border }]}>
        <Text style={[styles.targetLabel, isDark && { color: theme.textSecondary }]}>
          {isHi ? 'माला सङ्कल्प लक्ष्य चुनें:' : 'Daily Mala Goal:'}
        </Text>
        <View style={styles.targetPills}>
          {[1, 3, 5, 11, 21, 108].map((count) => {
            const isTarget = targetMalas === count;
            return (
              <TouchableOpacity
                key={count}
                testID={`target-pill-${count}`}
                accessibilityRole="button"
                accessibilityLabel={isHi ? `${count} माला लक्ष्य चुनें` : `Set ${count} malas target`}
                accessibilityState={{ selected: isTarget }}
                style={[
                  styles.targetPill,
                  { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' },
                  isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border, borderWidth: 1 },
                  isTarget && styles.targetPillActive,
                ]}
                onPress={async () => {
                  if (hapticsEnabled) await triggerHaptic('tap');
                  setTargetMalas(count);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.targetPillText, isDark && { color: theme.textSecondary }, isTarget && styles.targetPillTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 180,
  },
  sacredBadge: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  mantraTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
    lineHeight: 24,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
  },
  resetBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  mantraBox: {
    backgroundColor: '#fffdf5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    marginBottom: 16,
  },
  mantraText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Devanagari' : undefined,
  },
  mantraMeaningText: {
    fontSize: 13.5,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  counterCenter: {
    alignItems: 'center',
    marginVertical: 8,
  },
  beadTouchZone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  outerRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 4,
    borderColor: '#fde68a',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
  },
  innerBeadCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  beadNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
  },
  beadTotal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fef3c7',
    marginTop: -2,
  },
  tapPrompt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#fef9c3',
    marginTop: 4,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#f4f4f5',
    borderRadius: 4,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#d97706',
    borderRadius: 4,
  },
  milestonesRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52525b',
  },
  milestoneActive: {
    color: '#b45309',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  statNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: '#18181b',
  },
  statLabel: {
    fontSize: 12.5,
    color: '#52525b',
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
  targetSelectorRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  targetLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#52525b',
    marginBottom: 10,
  },
  targetPills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  targetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
  },
  targetPillActive: {
    backgroundColor: '#b45309',
  },
  targetPillText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  targetPillTextActive: {
    color: '#ffffff',
  },
  milestoneToast: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  milestoneToastText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
