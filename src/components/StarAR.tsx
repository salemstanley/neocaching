import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { Prize } from '../game/types';
import { colors } from './ui';

const SIZE = 220;

// Prize names read like "a bowl of green bean casserole".

function starPoints(size: number) {
  const c = size / 2;
  const outer = size * 0.48;
  const inner = outer * 0.45;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${c + r * Math.cos(a)},${c + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

// Pokemon Go style: the camera shows the real world, and a spinning star floats
// in front of you. Tilting the phone shifts the star a little so it feels like
// it's hanging in the air. Tap the star to catch it. Courses can float a
// prize (like a Thanksgiving dish) instead of the star.
export function StarAR({ color, prize, onCaught }: { color: string; prize?: Prize; onCaught: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const spin = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const catchAnim = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [caught, setCaught] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }),
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    spinLoop.start();
    bobLoop.start();
    return () => {
      spinLoop.stop();
      bobLoop.stop();
    };
  }, [spin, bob]);

  useEffect(() => {
    let base: { beta: number; gamma: number } | null = null;
    DeviceMotion.setUpdateInterval(50);
    const sub = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;
      if (!base) base = { beta: rotation.beta, gamma: rotation.gamma };
      const clamp = (v: number) => Math.max(-140, Math.min(140, v));
      tilt.setValue({
        x: clamp(-(rotation.gamma - base.gamma) * 300),
        y: clamp(-(rotation.beta - base.beta) * 300),
      });
    });
    return () => sub.remove();
  }, [tilt]);

  const handleCatch = () => {
    if (caught) return;
    setCaught(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.timing(catchAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => onCaught());
  };

  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const scale = catchAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = catchAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.fill}>
      {permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      <Animated.View
        style={[styles.center, { transform: [{ translateX: tilt.x }, { translateY: tilt.y }] }]}
        pointerEvents="box-none"
      >
        <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
          <View style={[styles.shadow, { shadowColor: color }]} />
          <Pressable onPress={handleCatch} hitSlop={30}>
            <Animated.View style={{ transform: [{ perspective: 800 }, { rotateY }] }}>
              {prize ? (
                <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: SIZE * 0.68 }}>{prize.emoji}</Text>
                </View>
              ) : (
              <Svg width={SIZE} height={SIZE}>
                <Defs>
                  <RadialGradient id="g" cx="50%" cy="40%" r="60%">
                    <Stop offset="0" stopColor="#FFF6D5" />
                    <Stop offset="0.5" stopColor={color} />
                    <Stop offset="1" stopColor="#B86E00" />
                  </RadialGradient>
                </Defs>
                <Polygon points={starPoints(SIZE)} fill="url(#g)" stroke="#FFF6D5" strokeWidth={3} />
              </Svg>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>{caught
            ? prize
              ? `You collected ${prize.name}!`
              : 'Got it!'
            : prize
              ? `${prize.name[0].toUpperCase()}${prize.name.slice(1)} appeared! Tap it to collect it.`
              : 'A star appeared! Tap it to catch it.'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  shadow: {
    position: 'absolute',
    bottom: -30,
    alignSelf: 'center',
    width: SIZE * 0.6,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    shadowOpacity: 0.9,
    shadowRadius: 20,
  },
  banner: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(27,16,53,0.85)',
    borderRadius: 14,
    padding: 14,
  },
  bannerText: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
});
