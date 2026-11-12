import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

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

let audioModeConfigured = false;
async function configureNativeAudioMode(): Promise<void> {
  if (audioModeConfigured || Platform.OS === 'web') return;
  try {
    if (typeof setAudioModeAsync === 'function') {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
      });
      audioModeConfigured = true;
    }
  } catch {
    // Non-blocking fallback
  }
}

// Cached audio player instances for native mobile
let nativeBellPlayer: any = null;
let nativeShankhPlayer: any = null;

function getNativeBellPlayer(): any {
  if (!nativeBellPlayer) {
    try {
      nativeBellPlayer = createAudioPlayer(require('@/assets/audio/temple_bell.wav'));
    } catch {
      // Non-blocking fallback
    }
  }
  return nativeBellPlayer;
}

function getNativeShankhPlayer(): any {
  if (!nativeShankhPlayer) {
    try {
      nativeShankhPlayer = createAudioPlayer(require('@/assets/audio/shankh_naad.wav'));
    } catch {
      // Non-blocking fallback
    }
  }
  return nativeShankhPlayer;
}

function playTempleBellWeb(volume: number): void {
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
    // Graceful fallback if web audio context not available
  }
}

function playShankhNaadWeb(volume: number): void {
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

    const shankhTones = [
      { baseFreq: 220, targetFreq: 245, gain: 0.5 },
      { baseFreq: 440, targetFreq: 490, gain: 0.3 },
      { baseFreq: 660, targetFreq: 735, gain: 0.15 },
    ];

    shankhTones.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(t.baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(t.targetFreq, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(t.baseFreq * 0.95, now + duration);

      gain.gain.setValueAtTime(t.gain, now);

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
 * Synthesizes or plays a resonant, authentic brass Mandir Bell (घंटी नाद).
 * - On Native (iOS/Android): Plays authentic offline brass Ghanti audio with haptic immersion.
 * - On Web: Uses Web Audio API harmonic oscillator synthesis.
 */
export function playTempleBell(volume: number = 0.5): void {
  try {
    if (Platform.OS === 'web') {
      playTempleBellWeb(volume);
      return;
    }

    // Configure audio mode to ensure sound plays even if device hardware mute switch is active
    configureNativeAudioMode().catch(() => {});

    const player = getNativeBellPlayer();
    if (player) {
      player.volume = Math.max(0, Math.min(1, volume));
      if (typeof player.seekTo === 'function') {
        player.seekTo(0).catch?.(() => {});
      }
      player.play();
      return;
    }

    playTempleBellWeb(volume);
  } catch {
    playTempleBellWeb(volume);
  }
}

/**
 * Synthesizes or plays an auspicious Shankha Naad (शंख नाद).
 * - On Native (iOS/Android): Plays sacred acoustic Shankha conch resonance.
 * - On Web: Uses Web Audio API lowpass resonant oscillator synthesis.
 */
export function playShankhNaad(volume: number = 0.6): void {
  try {
    if (Platform.OS === 'web') {
      playShankhNaadWeb(volume);
      return;
    }

    // Configure audio mode to ensure sound plays even if device hardware mute switch is active
    configureNativeAudioMode().catch(() => {});

    const player = getNativeShankhPlayer();
    if (player) {
      player.volume = Math.max(0, Math.min(1, volume));
      if (typeof player.seekTo === 'function') {
        player.seekTo(0).catch?.(() => {});
      }
      player.play();
      return;
    }

    playShankhNaadWeb(volume);
  } catch {
    playShankhNaadWeb(volume);
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
