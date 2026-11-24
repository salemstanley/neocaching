import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { distanceM, getHere } from '../../lib/location';
import { Body, Button, Card, colors } from '../ui';

// timeCredit: seconds taken back off the clock, so staying costs no time.
export type ChoiceOutcome = { bonus?: number; wipe?: boolean; timeCredit?: number };

// Walking farther than this from where they said yes counts as leaving.
const LEAVE_M = 75;

// A yes-or-no stop, like "get ice cream?". Both answers are the right one.
// Saying yes pauses the clock while they stay, so stopping never hurts their
// time, and staying the full stayMinutes adds a modest bonus on top. Leaving
// early (or tapping "I'm leaving") wipes out every point, for lying.
export function Choice({
  question,
  yesLabel,
  noLabel,
  yesText,
  noText,
  stayMinutes,
  bonus,
  onDone,
}: {
  question: string;
  yesLabel: string;
  noLabel: string;
  yesText: string;
  noText: string;
  stayMinutes: number;
  bonus: number;
  onDone: (won: boolean, outcome: ChoiceOutcome) => void;
}) {
  useKeepAwake();
  const [phase, setPhase] = useState<'ask' | 'no' | 'staying' | 'earned' | 'busted'>('ask');
  const [left, setLeft] = useState(stayMinutes * 60);
  const [away, setAway] = useState<number | null>(null);
  const anchor = useRef<{ latitude: number; longitude: number } | null>(null);

  // Count down while they stay.
  useEffect(() => {
    if (phase !== 'staying') return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'staying' && left <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setPhase('earned');
    }
  }, [left, phase]);

  // Watch that they don't wander off.
  useEffect(() => {
    if (phase !== 'staying') return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      try {
        const here = await getHere();
        anchor.current = { latitude: here.coords.latitude, longitude: here.coords.longitude };
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 }, (loc) => {
          if (!anchor.current) return;
          const d = distanceM(anchor.current, loc.coords);
          setAway(d);
          if (d > LEAVE_M + Math.min(loc.coords.accuracy ?? 0, 25)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            setPhase('busted');
          }
        });
        if (cancelled) sub.remove();
      } catch {
        // No location: the honor system it is.
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [phase]);

  if (phase === 'ask') {
    return (
      <View style={{ gap: 12 }}>
        <Body style={{ fontSize: 20, fontWeight: '700' }}>{question}</Body>
        <Body style={{ color: colors.muted, fontSize: 14 }}>
          It's up to you, and either way is the right call. If you stop, the clock pauses while you're here, and staying {stayMinutes} minutes earns {bonus} bonus points. Just don't say yes and then run off: that loses ALL your points.
        </Body>
        <Button title={yesLabel} onPress={() => setPhase('staying')} />
        <Button kind="secondary" title={noLabel} onPress={() => setPhase('no')} />
      </View>
    );
  }

  if (phase === 'no') {
    return (
      <View style={{ gap: 12 }}>
        <Card>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>✋</Text>
          <Body>{noText}</Body>
        </Card>
        <Button title="Take my high five and go" onPress={() => onDone(true, {})} />
      </View>
    );
  }

  if (phase === 'staying') {
    const m = Math.floor(left / 60);
    const s = left % 60;
    return (
      <View style={{ gap: 12 }}>
        <Card>
          <Body>{yesText}</Body>
        </Card>
        <Text style={{ color: colors.gold, fontSize: 56, fontWeight: '800', textAlign: 'center' }}>
          {m}:{s.toString().padStart(2, '0')}
        </Text>
        <Body style={{ textAlign: 'center' }}>The clock is paused. Stay here and enjoy it, and keep this screen open.</Body>
        {away !== null && <Body style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>You're about {Math.round(away * 3.281)} ft from where you said yes.</Body>}
        <Button kind="secondary" title="I'm leaving early (lose all my points)" onPress={() => setPhase('busted')} />
      </View>
    );
  }

  if (phase === 'earned') {
    return (
      <View style={{ gap: 12 }}>
        <Card>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>🎉</Text>
          <Body style={{ fontWeight: '800', color: colors.good }}>You stayed! +{bonus} bonus points, and the time you spent here doesn't count.</Body>
        </Card>
        <Button title="Continue" onPress={() => onDone(true, { bonus, timeCredit: stayMinutes * 60 })} />
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Text style={{ fontSize: 48, textAlign: 'center' }}>🤥</Text>
        <Body style={{ fontWeight: '800', color: colors.bad }}>Liar! You said yes, but you left early. All your points are gone.</Body>
      </Card>
      <Button title="Fine. Continue." onPress={() => onDone(false, { wipe: true })} />
    </View>
  );
}
