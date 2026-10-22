import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { SpotLocation } from '../game/types';
import { bearingDeg, distanceM } from '../lib/location';
import { Body, Card, colors } from './ui';

// Points toward the next cache, relative to the way the phone is facing.
export function DirectionArrow({
  me,
  target,
  heading,
  label,
}: {
  me: SpotLocation | null;
  target: SpotLocation | undefined;
  heading: number | null;
  label: string;
}) {
  if (!target) {
    return (
      <Card>
        <Body style={{ color: colors.muted }}>The arrow needs {label}'s spot saved in Set up first.</Body>
      </Card>
    );
  }
  if (!me) {
    return (
      <Card>
        <Body style={{ color: colors.muted }}>Finding your location…</Body>
      </Card>
    );
  }

  const rotation = bearingDeg(me, target) - (heading ?? 0);
  const feet = Math.round(distanceM(me, target) * 3.281);
  return (
    <Card style={{ alignItems: 'center' }}>
      <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
        <Svg width={110} height={110} viewBox="0 0 100 100">
          <Polygon points="50,4 86,92 50,72 14,92" fill={colors.gold} stroke="#FFF6D5" strokeWidth={3} />
        </Svg>
      </View>
      <Body style={{ fontWeight: '800' }}>
        {label}: about {feet} ft
      </Body>
      {heading === null && <Body style={{ color: colors.muted, fontSize: 14 }}>Hold your phone flat to point the arrow.</Body>}
    </Card>
  );
}
