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

// Compass bearing from a to b in degrees, 0 = north, 90 = east.
export function bearingDeg(a: SpotLocation, b: SpotLocation): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b.longitude - a.longitude)) * Math.cos(rad(b.latitude));
  const x =
    Math.cos(rad(a.latitude)) * Math.sin(rad(b.latitude)) -
    Math.sin(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(rad(b.longitude - a.longitude));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Moves from a point by a distance (meters) along a bearing (degrees).
// Flat-earth math is plenty accurate over a few hundred meters.
export function offsetBy(from: SpotLocation, meters: number, bearing: number): SpotLocation {
  const rad = (bearing * Math.PI) / 180;
  const north = meters * Math.cos(rad);
  const east = meters * Math.sin(rad);
  return {
    latitude: from.latitude + north / 111320,
    longitude: from.longitude + east / (111320 * Math.cos((from.latitude * Math.PI) / 180)),
  };
}
