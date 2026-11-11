import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Shared Web Audio context instance for web platforms
let webAudioCtx: any = null;

function getWebAudioContext(): any {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!webAudioCtx || webAudioCtx.state === 'closed') {
    webAudioCtx = new AudioCtx();
  }
  if (webAudioCtx.state === 'suspended') {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

// Mandir brass bell harmonic frequencies (Fundamental D5 ~587Hz with characteristic bell overtones)
export const TEMPLE_BELL_HARMONICS = [
  { freq: 587.33, gain: 0.6, decay: 1.8 }, // Fundamental bell chime
  { freq: 1174.66, gain: 0.35, decay: 1.4 }, // 1st octave overtone
  { freq: 1762.0, gain: 0.2, decay: 0.9 }, // 3rd harmonic
  { freq: 2349.32, gain: 0.15, decay: 0.6 }, // Bell shimmer
  { freq: 2936.65, gain: 0.08, decay: 0.4 }, // High sparkle
];

/**
 * Synthesizes a resonant, authentic brass Mandir Bell (घंटी नाद)
 * using acoustic harmonic overtones and exponential natural decay.
 */
export function playTempleBell(volume: number = 0.5): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    TEMPLE_BELL_HARMONICS.forEach((h) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.freq, now);

      gain.gain.setValueAtTime(h.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + h.decay);
    });
  } catch {
    // Graceful fallback if audio context not available
  }
}

/**
 * Synthesizes an auspicious Shankha Naad (शंख नाद)
 * with characteristic continuous breath resonance and frequency modulation.
 */
export function playShankhNaad(volume: number = 0.6): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 2.4;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    // Conch resonance frequencies (Fundamental around 220Hz - A3 with rich overtones)
    const shankhTones = [
      { baseFreq: 220, targetFreq: 245, gain: 0.5 },
      { baseFreq: 440, targetFreq: 490, gain: 0.3 },
      { baseFreq: 660, targetFreq: 735, gain: 0.15 },
    ];

    shankhTones.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // Slight pitch rise and fall mimicking blowing air into conch
      osc.frequency.setValueAtTime(t.baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(t.targetFreq, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(t.baseFreq * 0.95, now + duration);

      gain.gain.setValueAtTime(t.gain, now);

      // Lowpass filter to give warm, deep, acoustic conch resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Tactile Haptic Feedback triggers for devotional touch immersion.
 */
export async function triggerHaptic(
  type: 'bead' | 'quarter' | 'malaComplete' | 'tap' | 'heavy',
  hapticsEnabled: boolean = true
): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'bead') navigator.vibrate(12);
        else if (type === 'quarter') navigator.vibrate([25, 30, 25]);
        else if (type === 'malaComplete') navigator.vibrate([60, 40, 80, 40, 120]);
        else navigator.vibrate(15);
      }
      return;
    }

    switch (type) {
      case 'bead':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'quarter':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'malaComplete':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'tap':
      default:
        await Haptics.selectionAsync();
        break;
    }
  } catch {
    // Non-blocking fallback
  }
}
