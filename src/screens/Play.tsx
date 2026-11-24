import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Switch, Text, View } from 'react-native';
import { POINTS, withArrow } from '../game/scoring';
import { Game, SpotLocation, TAG_LABELS, TagCode } from '../game/types';
import { COIN_RADIUS_M, coinsForLeg } from '../lib/coins';

import { checkNearby, distanceM } from '../lib/location';
import { cancelScan, nfcStatus, readTagCode } from '../lib/nfc';
import { useGameSounds } from '../lib/sounds';
import { Photos, loadPhotos } from '../lib/photos';
import { Run, Spots, formatTime, loadCourseSpots, loadSettings, runSeconds, spotsKey } from '../lib/storage';
import { CacheMap, MapCache } from '../components/CacheMap';
import { CoinAR } from '../components/CoinAR';
import { ClueCard } from '../components/ClueCard';
import { DirectionArrow } from '../components/DirectionArrow';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

export function Play({
  game,
  run,
  onRunChange,
  onCheckpoint,
  onQuit,
}: {
  game: Game;
  run: Run;
  onRunChange: (run: Run) => void;
  onCheckpoint: (tag: TagCode) => void;
  onQuit: () => void;
}) {
  useKeepAwake(); // keep the screen on while walking the loop
  const [now, setNow] = useState(Date.now());
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spots>({});
  const [me, setMe] = useState<SpotLocation | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [popup, setPopup] = useState<{ text: string; good: boolean } | null>(null);
  const [photos, setPhotos] = useState<Photos>({});
  const [coinView, setCoinView] = useState(false);
  const { playCoin, playWarning, playTurkey } = useGameSounds();
  const [attack, setAttack] = useState(false);

  // Tags must be found in order. The clue for the next tag comes from the one
  // before it (or the game's start clue).
  const nextIndex = game.checkpoints.findIndex((c) => !run.done.includes(c.tag));
  const next = game.checkpoints[nextIndex];
  const prev = game.checkpoints[nextIndex - 1];
  const clue = nextIndex === 0 ? game.startClue : prev?.clue;
  const arrowOn = !!next && run.arrowLegs.includes(next.tag);

  // Coins only exist between two saved spots (or from the course's start spot).
  const coins = useMemo(() => {
    const from = prev ? spots[prev.tag] : game.startSpot;
    const to = next && spots[next.tag];
    if (!next || !from || !to) return [];
    const items = game.trailItems;
    return coinsForLeg(next.tag, from, to, game.bends?.[next.tag]).map((c, i) => (items?.length && c.good ? { ...c, symbol: items[i % items.length] } : c));
  }, [prev, next, spots, game]);

  // The location callback outlives renders, so it reads the latest values here.
  const coinRadius = game.coinRadiusM ?? COIN_RADIUS_M;
  const latest = useRef({ run, coins, arrowOn, onRunChange, playCoin, playWarning, playTurkey, coinRadius, game });
  latest.current = { run, coins, arrowOn, onRunChange, playCoin, playWarning, playTurkey, coinRadius, game };

  useEffect(() => {
    loadCourseSpots(game).then(setSpots);
    loadPhotos(spotsKey(game)).then(setPhotos);
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => {
      clearInterval(id);
      cancelScan();
    };
  }, []);

  // Follow the player's position and pick up any coins they walk over.
  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || cancelled) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 1, timeInterval: 1000 },
        (loc) => {
          const here = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setMe(here);
          const { run: r, coins: legCoins, arrowOn: arrow } = latest.current;
          const hit = legCoins.find((c) => !r.coins.includes(c.id) && distanceM(here, c) <= latest.current.coinRadius);
          if (!hit) return;
          const wrongWay = latest.current.game.wrongWay;
          const points = hit.good ? withArrow(POINTS.coin, arrow) : wrongWay?.points ?? POINTS.wrongWayCoin;
          latest.current.onRunChange({ ...r, coins: [...r.coins, hit.id], points: r.points + points });
          if (hit.good) latest.current.playCoin();
          else if (wrongWay?.sound === 'turkey') latest.current.playTurkey();
          else latest.current.playWarning();
          if (!hit.good && wrongWay) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            setAttack(true);
          }
          setPopup({
            text: hit.good ? `${hit.symbol ?? '🪙'} +${points}` : wrongWay ? `${wrongWay.name}! ${points}` : `⚠️ Wrong way! ${points}`,
            good: hit.good,
          });
        },
      );
      if (cancelled) sub.remove();
    })().catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  // The compass is only needed while the arrow is on.
  useEffect(() => {
    if (!arrowOn) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading))
      .then((s) => (cancelled ? s.remove() : (sub = s)))
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [arrowOn]);

  useEffect(() => {
    if (!attack) return;
    const id = setTimeout(() => setAttack(false), 1600);
    return () => clearTimeout(id);
  }, [attack]);

  useEffect(() => {
    if (!popup) return;
    const id = setTimeout(() => setPopup(null), 1800);
    return () => clearTimeout(id);
  }, [popup]);

  const toggleArrow = (on: boolean) => {
    if (!next) return;
    // Once the arrow has been used on a stretch, that stretch stays at half points.
    if (on && !run.arrowLegs.includes(next.tag)) onRunChange({ ...run, arrowLegs: [...run.arrowLegs, next.tag] });
  };

  const hintPhoto = next ? photos[next.tag] : undefined;
  const hintShown = !!next && run.hintTags.includes(next.tag);
  const showHint = () => {
    if (next && !hintShown) onRunChange({ ...run, hintTags: [...run.hintTags, next.tag], points: run.points + POINTS.hint });
  };
  const coinsLeft = coins.filter((c) => c.good && !run.coins.includes(c.id));

  const mapCaches: MapCache[] = game.checkpoints.flatMap((cp) => {
    const spot = spots[cp.tag];
    if (!spot) return [];
    const status = run.done.includes(cp.tag) ? 'found' : cp.tag === next?.tag ? 'next' : 'later';
    return [{ ...spot, label: TAG_LABELS[cp.tag], status }];
  });

  const scan = async () => {
    setMessage(null);
    const status = await nfcStatus();
    if (status === 'unsupported') return setMessage('This phone cannot read NFC tags.');
    if (status === 'off') return setMessage('NFC is turned off. Turn it on in your phone settings, then try again.');

    setScanning(true);
    try {
      const tag = await readTagCode();
      if (!tag) return setMessage("That tag isn't a Neocaching checkpoint. Write it first under Write tags and settings.");
      if (run.done.includes(tag)) return setMessage('You already captured that tag. Follow your clue to the next one!');
      if (tag !== next.tag) {
        return setMessage(`That's ${TAG_LABELS[tag]}, but you need ${TAG_LABELS[next.tag]} next. Follow your clue!`);
      }

      const settings = await loadSettings();
      if (!settings.skipGps) {
        setMessage('Checking your location…');
        const near = await checkNearby(spots[tag]);
        if (!near.ok) {
          return setMessage(`You're about ${Math.round(near.distance)} m from this checkpoint. Move closer and tap again.`);
        }
      }
      setMessage(null);
      onCheckpoint(tag);
    } catch (e) {
      setMessage(e instanceof Error && e.message !== 'Already scanning' ? e.message : 'Scan cancelled. Tap the button to try again.');
    } finally {
      setScanning(false);
    }
  };

  const stop = () => {
    cancelScan();
    setScanning(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Title>{game.title}</Title>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {game.timed !== false && (
            <Text style={{ color: colors.gold, fontSize: 40, fontWeight: '800' }}>{formatTime(runSeconds(run, now))}</Text>
          )}
          <Text style={{ color: colors.good, fontSize: 40, fontWeight: '800' }}>{run.points} pts</Text>
        </View>
        {game.timed !== false && run.penaltySeconds > 0 && (
          <Body style={{ textAlign: 'center', color: colors.bad }}>Includes +{run.penaltySeconds}s penalty time</Body>
        )}

        <Card>
          {game.checkpoints.map((cp) => {
            const done = run.done.includes(cp.tag);
            return (
              <Body key={cp.tag} style={{ color: done ? colors.good : colors.text }}>
                {done ? '✅' : cp.prize?.emoji ?? (cp.tag === 'boss' ? '👑' : '⭐')} {cp.title}{' '}
                <Body style={{ color: colors.muted, fontSize: 14 }}>({TAG_LABELS[cp.tag]})</Body>
              </Body>
            );
          })}
        </Card>

        {run.done.length === 0 && (
          <Card>
            <Body>{game.intro}</Body>
          </Card>
        )}
        {clue && <ClueCard clue={clue} />}

        {scanning ? (
          <Card style={{ alignItems: 'center' }}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Body>Hold the back of your phone against a tag…</Body>
            <Button kind="secondary" title="Cancel" onPress={stop} />
          </Card>
        ) : (
          <Button title="Tap a checkpoint tag" onPress={scan} />
        )}
        {message && <Body style={{ color: colors.gold }}>{message}</Body>}

        {next && hintPhoto && (
          <Card>
            {hintShown ? (
              <>
                <Body style={{ fontWeight: '800' }}>Here's where {TAG_LABELS[next.tag]} is hidden:</Body>
                <Image source={{ uri: hintPhoto }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12 }} resizeMode="cover" />
              </>
            ) : (
              <>
                <Button kind="secondary" title="🔍 Show me the hiding spot" onPress={showHint} />
                <Body style={{ color: colors.muted, fontSize: 14 }}>Stuck? Peek at a photo. Costs {-POINTS.hint} points.</Body>
              </>
            )}
          </Card>
        )}

        {coins.length > 0 && (
          <Button kind="secondary" title={`${game.trailItems?.[0] ?? '🪙'} Look for ${game.trailName ?? 'coins'} (${coinsLeft.length} left)`} onPress={() => setCoinView(true)} />
        )}

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Body style={{ flex: 1 }}>Show the map</Body>
            <Switch value={showMap} onValueChange={setShowMap} trackColor={{ true: colors.gold }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Body>Direction arrow</Body>
              <Body style={{ color: colors.muted, fontSize: 14 }}>
                Easier, but half points until the next tag.
              </Body>
            </View>
            <Switch value={arrowOn} onValueChange={toggleArrow} disabled={arrowOn} trackColor={{ true: colors.gold }} />
          </View>
        </Card>

        {arrowOn && next && (
          <DirectionArrow me={me} target={spots[next.tag]} heading={heading} label={TAG_LABELS[next.tag]} />
        )}
        {showMap && <CacheMap caches={mapCaches} me={me} arrowTo={arrowOn && next ? spots[next.tag] ?? null : null} />}

        <View style={{ height: 20 }} />
        <Button kind="secondary" title="Back to menu" onPress={onQuit} />
      </Screen>

      {coinView && <CoinAR me={me} coins={coinsLeft} name={game.trailName} onClose={() => setCoinView(false)} />}

      {attack && game.wrongWay && <Attack emoji={game.wrongWay.emoji} />}

      {popup && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 120,
            alignSelf: 'center',
            backgroundColor: popup.good ? colors.gold : colors.bad,
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: colors.bg, fontSize: 28, fontWeight: '900' }}>{popup.text}</Text>
        </View>
      )}
    </View>
  );
}

// A wrong-way attacker (like an angry turkey) charges at the screen.
function Attack({ emoji }: { emoji: string }) {
  const charge = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(charge, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      ]),
      { iterations: 10 },
    ).start();
  }, [charge, shake]);
  const scale = charge.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.6] });
  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-18, 18] });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,60,60,0.25)' }}>
      <Animated.Text style={{ fontSize: 160, transform: [{ scale }, { translateX }] }}>{emoji}</Animated.Text>
    </View>
  );
}
