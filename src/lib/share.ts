import { Share } from 'react-native';
import { Game } from '../game/types';
import { Spots } from './storage';

const MARKER = 'NEOCACHE1:';

// Sends a course (and where its tags are) as a text message the other phone
// can paste into Import a course.
export async function shareCourse(course: Game, spots: Spots) {
  const payload = JSON.stringify({ course, spots });
  await Share.share({
    message:
      `Neocaching course: ${course.title}\n\n` +
      'Open Neocaching, tap Import a course, and paste this whole message.\n\n' +
      MARKER +
      payload,
  });
}

export function parseSharedCourse(text: string): { course: Game; spots: Spots } | null {
  const i = text.indexOf(MARKER);
  if (i < 0) return null;
  try {
    const { course, spots } = JSON.parse(text.slice(i + MARKER.length).trim());
    if (!course?.checkpoints?.length) return null;
    return { course: { ...course, id: `custom-${Date.now()}`, custom: true }, spots: spots ?? {} };
  } catch {
    return null;
  }
}
