import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game, SpotLocation, TagCode } from '../game/types';

// points is missing on scores saved before points existed.
export type Score = { name: string; gameId: string; seconds: number; points?: number; date: string };
export type Spots = Partial<Record<TagCode, SpotLocation>>;
// anthropicKey lets the course wizard ask Claude to write courses. It stays on this phone.
export type Settings = { skipGps: boolean; playerName: string; anthropicKey: string };

const KEYS = { scores: 'scores', settings: 'settings', courses: 'courses' };

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

// Courses that share hidden tags (like the age versions of one course) share spots.
export const spotsKey = (course: Game) => course.spotsId ?? course.id;

// Each course remembers where its tags are hidden.
export async function loadSpots(courseId: string): Promise<Spots> {
  const spots = await load<Spots>(`spots:${courseId}`, {});
  // Spots saved before courses existed belong to the pioneer course.
  if (courseId === 'pioneer' && Object.keys(spots).length === 0) return load<Spots>('spots', {});
  return spots;
}
export const saveSpots = (courseId: string, s: Spots) =>
  AsyncStorage.setItem(`spots:${courseId}`, JSON.stringify(s));

// Courses made in the app's course maker.
export const loadCustomCourses = () => loadList<Game>(KEYS.courses);

export async function saveCustomCourse(course: Game) {
  const courses = await loadCustomCourses();
  const i = courses.findIndex((c) => c.id === course.id);
  if (i >= 0) courses[i] = course;
  else courses.push(course);
  await AsyncStorage.setItem(KEYS.courses, JSON.stringify(courses));
}

export async function deleteCustomCourse(id: string) {
  const courses = (await loadCustomCourses()).filter((c) => c.id !== id);
  await AsyncStorage.setItem(KEYS.courses, JSON.stringify(courses));
  await AsyncStorage.removeItem(`spots:${id}`);
}

export const loadSettings = () => load<Settings>(KEYS.settings, { skipGps: false, playerName: '', anthropicKey: '' });
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
  // Tags whose hiding-spot photo the player peeked at.
  hintTags: TagCode[];
};

export async function loadRun(): Promise<Run | null> {
  try {
    const raw = await AsyncStorage.getItem('run');
    return raw ? { points: 0, coins: [], arrowLegs: [], hintTags: [], ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export const saveRun = (run: Run | null) =>
  run ? AsyncStorage.setItem('run', JSON.stringify(run)) : AsyncStorage.removeItem('run');

export function runSeconds(run: Run, now = Date.now()) {
  return (now - run.startedAt) / 1000 + run.penaltySeconds;
}
