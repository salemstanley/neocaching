import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { SpotLocation } from '../game/types';
import { Coin } from '../lib/coins';
import { bearingDeg, distanceM } from '../lib/location';
import { colors } from './ui';

// How far to each side of straight ahead the camera "sees", in degrees.
const HALF_VIEW = 30;
// Coins farther than this are too far away to draw.
const MAX_DISTANCE_M = 90;

function CoinPicture({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="coin" cx="40%" cy="35%" r="65%">
          <Stop offset="0" stopColor="#FFF6D5" />
          <Stop offset="0.55" stopColor="#F5B841" />
          <Stop offset="1" stopColor="#B86E00" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="46" fill="url(#coin)" stroke="#8A5200" strokeWidth="4" />
      <Circle cx="50" cy="50" r="33" fill="none" stroke="#FFF6D5" strokeWidth="3" opacity={0.7} />
      <SvgText x="50" y="64" fontSize="40" fontWeight="900" fill="#8A5200" textAnchor="middle">
        ¢
      </SvgText>
    </Svg>
  );
}

// How close (in meters) you need to be to grab an item. Phone GPS wanders a
// few meters, so this is generous: about 50 feet.
export const GRAB_RANGE_M = 15;

// Hot or cold, by how far away the nearest item is.
export function warmth(d: number): { label: string; fill: number } {
  const fill = Math.max(0.05, Math.min(1, 1 - (d - GRAB_RANGE_M) / (MAX_DISTANCE_M - GRAB_RANGE_M)));
  if (d <= GRAB_RANGE_M) return { label: "You're right on it!", fill: 1 };
  if (d <= 30) return { label: 'Hot! 🔥', fill };
  if (d <= 60) return { label: 'Warmer 🙂', fill };
  return { label: 'Cold ❄️', fill };
}

export function WarmthBar({ fill }: { fill: number }) {
  return (
    <View style={styles.bar}>
      <View style={[styles.fill, { width: `${Math.round(fill * 100)}%`, backgroundColor: fill > 0.66 ? '#FF6B3D' : fill > 0.33 ? colors.gold : '#6FB7FF' }]} />
    </View>
  );
}

// Look through the camera and see the items floating in the direction they
// are. Turn around to find more. Get close and tap Grab it!
export function CoinAR({
  me,
  coins,
  name = 'coins',
  onGrab,
  onClose,
}: {
  me: SpotLocation | null;
  coins: Coin[];
  name?: string;
  onGrab: (coin: Coin) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [heading, setHeading] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  const bob = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const smooth = useRef<number | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  // The compass jitters a lot, so ease toward each new reading instead of
  // jumping. That keeps the items steady on screen.
  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      const prev = smooth.current;
      if (prev === null) smooth.current = raw;
      else {
        const diff = ((raw - prev + 540) % 360) - 180;
        smooth.current = (prev + diff * 0.15 + 360) % 360;
      }
      const next = smooth.current;
      setHeading((old) => (old === null || Math.abs(((next - old + 540) % 360) - 180) >= 1 ? next : old));
    })
      .then((s) => (cancelled ? s.remove() : (sub = s)))
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [bob, pulse]);

  const floatY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const grow = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const placed = me
    ? coins
        .map((c) => {
          const d = distanceM(me, c);
          let rel = heading === null ? 999 : bearingDeg(me, c) - heading;
          if (heading !== null) rel = ((rel + 540) % 360) - 180; // -180..180, 0 = straight ahead
          return { coin: c, d, rel };
        })
        .filter((p) => p.d <= MAX_DISTANCE_M)
        .sort((a, b) => b.d - a.d) // far ones first so near ones draw on top
    : [];
  const nearestAll = me && coins.length ? Math.min(...coins.map((c) => distanceM(me, c))) : null;
  const grabbable = placed.length && placed[placed.length - 1].d <= GRAB_RANGE_M ? placed[placed.length - 1].coin : null;
  const others = placed.filter((p) => p.coin !== grabbable);
  const inView = others.filter((p) => Math.abs(p.rel) <= HALF_VIEW + 5);
  const toLeft = others.filter((p) => p.rel < -HALF_VIEW - 5).length;
  const toRight = others.filter((p) => p.rel > HALF_VIEW + 5 && p.rel <= 180).length;

  let status: string;
  if (!me) status = 'Finding your location…';
  else if (coins.length === 0) status = `No ${name} left on this stretch. Head for the next tag!`;
  else if (grabbable) status = 'Got one! Tap it to grab it!';
  else if (heading === null) status = 'Finding which way you are facing…';
  else if (placed.length === 0) status = `Keep walking toward the next tag to find ${name}.`;
  else if (inView.length) status = 'Walk toward it!';
  else status = `Turn around slowly to find the ${name}.`;

  const grabSymbol = (c: Coin) =>
    c.symbol ? <Text style={{ fontSize: 150 }}>{c.symbol}</Text> : <CoinPicture size={170} />;

  return (
    <View style={StyleSheet.absoluteFill}>
      {permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      {inView.map(({ coin, d, rel }) => {
        const size = Math.max(40, Math.min(130, (130 * 10) / Math.max(d, 1)));
        const x = width / 2 + (rel / HALF_VIEW) * (width / 2) - size / 2;
        // Farther items sit higher, nearer the horizon.
        const y = height * 0.6 - (Math.min(d, 60) / 60) * height * 0.2 - size / 2;
        return (
          <Animated.View key={coin.id} pointerEvents="none" style={{ position: 'absolute', left: x, top: y, transform: [{ translateY: floatY }] }}>
            {coin.symbol ? (
              <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: size * 0.8 }}>{coin.symbol}</Text>
              </View>
            ) : (
              <CoinPicture size={size} />
            )}
          </Animated.View>
        );
      })}

      {/* Close enough: the item sits still in the middle, glowing. One tap grabs it. */}
      {grabbable && (
        <Pressable onPress={() => onGrab(grabbable)} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Animated.View style={[styles.glow, { transform: [{ scale: grow }] }]}>{grabSymbol(grabbable)}</Animated.View>
        </Pressable>
      )}

      {toLeft > 0 && !grabbable && (
        <View style={[styles.side, { left: 10 }]} pointerEvents="none">
          <Text style={styles.sideText}>⬅️ {toLeft}</Text>
        </View>
      )}
      {toRight > 0 && !grabbable && (
        <View style={[styles.side, { right: 10 }]} pointerEvents="none">
          <Text style={styles.sideText}>{toRight} ➡️</Text>
        </View>
      )}

      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>{status}</Text>
        {nearestAll !== null && !grabbable && (
          <>
            <Text style={styles.small}>
              {warmth(nearestAll).label} About {Math.round(nearestAll * 3.281)} ft away
            </Text>
            <WarmthBar fill={warmth(nearestAll).fill} />
          </>
        )}
      </View>

      <View style={styles.bottom}>
        {grabbable && (
          <Pressable onPress={() => onGrab(grabbable)} style={[styles.close, { backgroundColor: colors.good }]}>
            <Text style={[styles.closeText, { fontSize: 24 }]}>✋ Grab it!</Text>
          </Pressable>
        )}
        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>Close the camera</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: 'rgba(27,16,53,0.85)', borderRadius: 14, padding: 14, gap: 4 },
  bannerText: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  small: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  side: { position: 'absolute', top: '48%', backgroundColor: 'rgba(27,16,53,0.85)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  sideText: { color: colors.gold, fontSize: 22, fontWeight: '900' },
  bottom: { position: 'absolute', bottom: 50, left: 40, right: 40, gap: 12 },
  close: { backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  glow: { padding: 24, borderRadius: 200, backgroundColor: 'rgba(245,184,65,0.35)', borderWidth: 4, borderColor: '#FFE9A8', shadowColor: '#F5B841', shadowOpacity: 1, shadowRadius: 30, elevation: 20 },
  bar: { height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 6 },
  closeText: { color: colors.bg, fontSize: 18, fontWeight: '800' },
});
