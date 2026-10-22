import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpotLocation, TagCode } from '../game/types';

// points is missing on scores saved before points existed.
export type Score = { name: string; gameId: string; seconds: number; points?: number; date: string };
export type Spots = Partial<Record<TagCode, SpotLocation>>;
export type Settings = { skipGps: boolean; playerName: string };

const KEYS = { scores: 'scores', spots: 'spots', settings: 'settings' };

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

async function loadList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const loadSpots = () => load<Spots>(KEYS.spots, {});
export const saveSpots = (s: Spots) => AsyncStorage.setItem(KEYS.spots, JSON.stringify(s));

export const loadSettings = () => load<Settings>(KEYS.settings, { skipGps: false, playerName: '' });
export const saveSettings = (s: Settings) => AsyncStorage.setItem(KEYS.settings, JSON.stringify(s));

export const loadScores = () => loadList<Score>(KEYS.scores);
export async function addScore(score: Score) {
  const scores = await loadScores();
  scores.push(score);
  scores.sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || a.seconds - b.seconds);
  await AsyncStorage.setItem(KEYS.scores, JSON.stringify(scores.slice(0, 50)));
}

export function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// The game in progress, saved so closing the app doesn't lose it.
export type Run = {
  gameId: string;
  startedAt: number;
  penaltySeconds: number;
  done: TagCode[];
  points: number;
  // Ids of coins already picked up.
  coins: string[];
  // Next-tag codes for the stretches of trail where the arrow was turned on.
  arrowLegs: TagCode[];
};

export async function loadRun(): Promise<Run | null> {
  try {
    const raw = await AsyncStorage.getItem('run');
    return raw ? { points: 0, coins: [], arrowLegs: [], ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export const saveRun = (run: Run | null) =>
  run ? AsyncStorage.setItem('run', JSON.stringify(run)) : AsyncStorage.removeItem('run');

export function runSeconds(run: Run, now = Date.now()) {
  return (now - run.startedAt) / 1000 + run.penaltySeconds;
}
