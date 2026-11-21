import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic, playTempleBell } from '@/src/services/sacredAudio';

interface JapaMalaViewProps {
  mantraTitle: string;
  mantraDevanagari: string;
  mantraMeaning?: string;
  audioEnabled?: boolean;
  hapticsEnabled?: boolean;
}

export function JapaMalaView({
  mantraTitle,
  mantraDevanagari,
  mantraMeaning,
  audioEnabled = true,
  hapticsEnabled = true,
}: JapaMalaViewProps) {
  const [currentBead, setCurrentBead] = useState<number>(0);
  const [completedMalas, setCompletedMalas] = useState<number>(0);
  const [targetMalas, setTargetMalas] = useState<number>(1);

  const handleBeadClick = async () => {
    const nextBead = currentBead + 1;

    if (nextBead === 108) {
      // Mala completed!
      setCurrentBead(0);
      setCompletedMalas((prev) => prev + 1);
      if (hapticsEnabled) await triggerHaptic('malaComplete');
      if (audioEnabled) playTempleBell(1.0);
    } else {
      setCurrentBead(nextBead);
      // Milestone haptics at 27, 54, 81
      if (nextBead === 27 || nextBead === 54 || nextBead === 81) {
        if (hapticsEnabled) await triggerHaptic('quarter');
      } else {
        if (hapticsEnabled) await triggerHaptic('bead');
      }
    }
  };

  const handleReset = async () => {
    if (hapticsEnabled) await triggerHaptic('tap');
    setCurrentBead(0);
    setCompletedMalas(0);
  };

  const progressPercent = Math.round((currentBead / 108) * 100);
  const totalMantraCount = completedMalas * 108 + currentBead;

  return (
    <View style={styles.cardContainer}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.sacredBadge}>📿 पवित्र १०८ जप माला</Text>
          <Text style={styles.mantraTitleText}>{mantraTitle}</Text>
        </View>
        <TouchableOpacity
          testID="japa-reset-btn"
          style={styles.resetBtn}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={16} color="#71717a" />
          <Text style={styles.resetBtnText}>रीसेट</Text>
        </TouchableOpacity>
      </View>

      {/* Mantra Display Box */}
      <View style={styles.mantraBox}>
        <Text style={styles.mantraText}>{mantraDevanagari}</Text>
        {mantraMeaning ? <Text style={styles.mantraMeaningText}>{mantraMeaning}</Text> : null}
      </View>

      {/* Center Bead Counter & Interactive Visual */}
      <View style={styles.counterCenter}>
        <TouchableOpacity
          testID="bead-touch-zone"
          style={styles.beadTouchZone}
          onPress={handleBeadClick}
          activeOpacity={0.85}
        >
          {/* Outer Ornamental Ring */}
          <View style={styles.outerRing}>
            <View style={styles.innerBeadCircle}>
              <Text testID="central-bead-number" style={styles.beadNumber}>{currentBead}</Text>
              <Text style={styles.beadTotal}>/ १०८ मनके</Text>
              <Text style={styles.tapPrompt}>यहाँ स्पर्श कर जपें</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Mala Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.milestonesRow}>
          <Text style={[styles.milestoneText, currentBead >= 27 && styles.milestoneActive]}>२७ (१/४)</Text>
          <Text style={[styles.milestoneText, currentBead >= 54 && styles.milestoneActive]}>५४ (अर्ध)</Text>
          <Text style={[styles.milestoneText, currentBead >= 81 && styles.milestoneActive]}>८१ (३/४)</Text>
          <Text style={[styles.milestoneText, currentBead === 108 && styles.milestoneActive]}>१०८ (पूर्ण)</Text>
        </View>
      </View>

      {/* Completed Malas Counter & Target Selector */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{completedMalas}</Text>
          <Text style={styles.statLabel}>माला पूर्ण</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalMantraCount}</Text>
          <Text style={styles.statLabel}>कुल मन्त्र जप</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{targetMalas}</Text>
          <Text style={styles.statLabel}>दैनिक लक्ष्य</Text>
        </View>
      </View>

      {/* Target Selector Pills */}
      <View style={styles.targetSelectorRow}>
        <Text style={styles.targetLabel}>माला सङ्कल्प लक्ष्य:</Text>
        <View style={styles.targetPills}>
          {[1, 3, 5, 11, 21, 108].map((count) => {
            const isTarget = targetMalas === count;
            return (
              <TouchableOpacity
                key={count}
                testID={`target-pill-${count}`}
                style={[styles.targetPill, isTarget && styles.targetPillActive]}
                onPress={async () => {
                  if (hapticsEnabled) await triggerHaptic('tap');
                  setTargetMalas(count);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.targetPillText, isTarget && styles.targetPillTextActive]}>
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
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  sacredBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mantraTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Devanagari' : undefined,
  },
  mantraMeaningText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#fef3c7',
    marginTop: -2,
  },
  tapPrompt: {
    fontSize: 10,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    marginTop: 6,
  },
  milestoneText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  milestoneActive: {
    color: '#d97706',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181b',
  },
  statLabel: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '600',
    marginTop: 2,
  },
  targetSelectorRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    marginBottom: 8,
  },
  targetPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  targetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
  },
  targetPillActive: {
    backgroundColor: '#d97706',
  },
  targetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52525b',
  },
  targetPillTextActive: {
    color: '#ffffff',
  },
});
