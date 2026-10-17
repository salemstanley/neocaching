import * as Location from 'expo-location';
import { SpotLocation } from '../game/types';

// How close (in meters) you must be to a tag for it to count.
export const UNLOCK_RADIUS_M = 30;

export async function getHere(): Promise<Location.LocationObject> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new Error('Location permission is needed to check you are at the checkpoint.');
  return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
}

// Straight-line distance between two GPS points, in meters.
export function distanceM(a: SpotLocation, b: SpotLocation): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type NearbyResult =
  | { ok: true; distance: number | null }
  | { ok: false; distance: number };

// GPS can be off by 5-20 m, so we allow a little extra on top of the radius.
export async function checkNearby(spot: SpotLocation | undefined): Promise<NearbyResult> {
  if (!spot) return { ok: true, distance: null }; // spot not set up yet
  const here = await getHere();
  const distance = distanceM(here.coords, spot);
  const slack = Math.min(here.coords.accuracy ?? 0, 20);
  return distance <= UNLOCK_RADIUS_M + slack ? { ok: true, distance } : { ok: false, distance };
}

const DIRECTIONS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];

// Compass direction from a to b, e.g. "northeast".
export function directionTo(a: SpotLocation, b: SpotLocation): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b.longitude - a.longitude)) * Math.cos(rad(b.latitude));
  const x =
    Math.cos(rad(a.latitude)) * Math.sin(rad(b.latitude)) -
    Math.sin(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(rad(b.longitude - a.longitude));
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return DIRECTIONS[Math.round(bearing / 45) % 8];
}

// A plain-language hint like "About 85 m to the northeast."
export async function compassHint(spot: SpotLocation | undefined): Promise<string> {
  if (!spot) return "This tag's spot hasn't been saved yet, so the compass can't help with it.";
  const here = await getHere();
  const d = distanceM(here.coords, spot);
  if (d <= UNLOCK_RADIUS_M) return "You're right on top of it! Look around.";
  return `About ${Math.round(d / 5) * 5} m to the ${directionTo(here.coords, spot)}.`;
}
