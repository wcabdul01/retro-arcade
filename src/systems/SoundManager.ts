import { Settings } from "./Settings";
import { vibrate } from "./Haptics";
import { ImpactStyle } from "@capacitor/haptics";

type WindowWithWebkitAudio = typeof window & { webkitAudioContext?: typeof AudioContext };

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (!Settings.soundEnabled) return null;
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = "square", volume = 0.12, delay = 0): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const startAt = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  private sweep(fromFreq: number, toFreq: number, duration: number, type: OscillatorType = "square", volume = 0.12): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  select(): void {
    this.tone(520, 0.04, "square", 0.08);
  }

  move(): void {
    this.tone(200, 0.03, "square", 0.06);
  }

  hit(): void {
    this.tone(140, 0.07, "square", 0.14);
  }

  shoot(): void {
    this.sweep(900, 300, 0.08, "square", 0.1);
  }

  score(): void {
    this.tone(760, 0.09, "square", 0.12);
  }

  rotate(): void {
    this.tone(420, 0.05, "square", 0.1);
  }

  lock(): void {
    this.tone(90, 0.06, "square", 0.14);
  }

  powerup(): void {
    this.sweep(300, 900, 0.18, "square", 0.12);
  }

  hurt(): void {
    this.sweep(300, 120, 0.18, "sawtooth", 0.14);
    vibrate(ImpactStyle.Light);
  }

  lineClear(): void {
    this.tone(523, 0.08, "square", 0.12, 0);
    this.tone(659, 0.08, "square", 0.12, 0.06);
    this.tone(784, 0.12, "square", 0.12, 0.12);
  }

  gameOver(): void {
    this.tone(300, 0.15, "sawtooth", 0.12, 0);
    this.tone(220, 0.15, "sawtooth", 0.12, 0.14);
    this.tone(140, 0.25, "sawtooth", 0.12, 0.28);
    vibrate(ImpactStyle.Heavy);
  }

  win(): void {
    this.tone(523, 0.1, "square", 0.12, 0);
    this.tone(659, 0.1, "square", 0.12, 0.1);
    this.tone(784, 0.1, "square", 0.12, 0.2);
    this.tone(1047, 0.2, "square", 0.12, 0.3);
    vibrate(ImpactStyle.Medium);
  }
}

export const sfx = new SoundManager();
