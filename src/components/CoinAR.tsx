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

// Look through the camera and see the coins floating in the direction they
// are. Turn around to find more. Walking to them still picks them up.
export function CoinAR({ me, coins, name = 'coins', onClose }: { me: SpotLocation | null; coins: Coin[]; name?: string; onClose: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [heading, setHeading] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading))
      .then((s) => (cancelled ? s.remove() : (sub = s)))
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const scaleX = spin.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.15, 1, 0.15, 1] });

  const placed =
    me && heading !== null
      ? coins
          .map((c) => {
            const d = distanceM(me, c);
            let rel = bearingDeg(me, c) - heading;
            rel = ((rel + 540) % 360) - 180; // -180..180, 0 = straight ahead
            return { coin: c, d, rel };
          })
          .filter((p) => p.d <= MAX_DISTANCE_M)
          .sort((a, b) => b.d - a.d) // far ones first so near ones draw on top
      : [];
  const inView = placed.filter((p) => Math.abs(p.rel) <= HALF_VIEW + 5);
  const toLeft = placed.filter((p) => p.rel < -HALF_VIEW - 5).length;
  const toRight = placed.filter((p) => p.rel > HALF_VIEW + 5).length;
  const nearest = placed.length ? Math.min(...placed.map((p) => p.d)) : null;

  let status: string;
  if (!me) status = 'Finding your location…';
  else if (heading === null) status = 'Finding which way you are facing…';
  else if (coins.length === 0) status = `No ${name} left on this stretch. Head for the next tag!`;
  else if (placed.length === 0) status = `The ${name} are too far away to see. Keep walking toward the next tag.`;
  else if (inView.length) status = `${inView.length} ahead! Walk to them to grab them.`;
  else status = `Turn around slowly to find the ${name}.`;

  return (
    <View style={StyleSheet.absoluteFill}>
      {permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      {inView.map(({ coin, d, rel }) => {
        const size = Math.max(36, Math.min(150, (150 * 8) / Math.max(d, 1)));
        const x = width / 2 + (rel / HALF_VIEW) * (width / 2) - size / 2;
        // Farther coins sit higher, nearer the horizon.
        const y = height * 0.62 - (Math.min(d, 60) / 60) * height * 0.2 - size / 2;
        return (
          <Animated.View key={coin.id} pointerEvents="none" style={{ position: 'absolute', left: x, top: y, transform: [{ scaleX }] }}>
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

      {toLeft > 0 && (
        <View style={[styles.side, { left: 10 }]} pointerEvents="none">
          <Text style={styles.sideText}>⬅️ {toLeft}</Text>
        </View>
      )}
      {toRight > 0 && (
        <View style={[styles.side, { right: 10 }]} pointerEvents="none">
          <Text style={styles.sideText}>{toRight} ➡️</Text>
        </View>
      )}

      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>{status}</Text>
        {nearest !== null && <Text style={styles.small}>Nearest one: about {Math.round(nearest * 3.281)} ft</Text>}
      </View>

      <Pressable onPress={onClose} style={styles.close}>
        <Text style={styles.closeText}>Close the camera</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: 'rgba(27,16,53,0.85)', borderRadius: 14, padding: 14, gap: 4 },
  bannerText: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  small: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  side: { position: 'absolute', top: '48%', backgroundColor: 'rgba(27,16,53,0.85)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  sideText: { color: colors.gold, fontSize: 22, fontWeight: '900' },
  close: { position: 'absolute', bottom: 50, left: 40, right: 40, backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  closeText: { color: colors.bg, fontSize: 18, fontWeight: '800' },
});
