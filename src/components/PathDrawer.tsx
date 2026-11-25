import * as Location from 'expo-location';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Game, SpotLocation, TAG_LABELS, TagCode } from '../game/types';
import { coinsForLeg } from '../lib/coins';
import { distanceM } from '../lib/location';
import { Paths, Spots } from '../lib/storage';
import { Body, Button, Card, Screen, Title, colors } from './ui';

// Draw the walking path for each stretch of the course with a finger, so the
// trail items follow the sidewalk instead of a straight line through houses.
// Or turn on "record as I walk" and the path follows your footsteps.
const HTML = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: #1B1035; }
  .tag { font: 700 12px sans-serif; text-align: center; white-space: nowrap; text-shadow: 0 0 3px #fff; }
  .tag b { display: block; font-size: 24px; line-height: 26px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #F5B841; border: 2px solid #8A5200; }
  .me { width: 16px; height: 16px; border-radius: 50%; background: #2F80FF; border: 3px solid #fff; }
</style></head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 21, maxNativeZoom: 20, subdomains: 'abcd', attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var drawOn = false, stroke = null, live = null, lastLeg = null;
  var el = map.getContainer();
  function ll(t) {
    var r = el.getBoundingClientRect();
    var p = map.containerPointToLatLng([t.clientX - r.left, t.clientY - r.top]);
    return [p.lat, p.lng];
  }
  el.addEventListener('touchstart', function (e) {
    if (!drawOn) return;
    e.preventDefault(); e.stopPropagation();
    stroke = [ll(e.touches[0])];
    live = L.polyline(stroke, { color: '#FF5A5A', weight: 6 }).addTo(map);
  }, { passive: false, capture: true });
  el.addEventListener('touchmove', function (e) {
    if (!drawOn || !stroke) return;
    e.preventDefault(); e.stopPropagation();
    stroke.push(ll(e.touches[0]));
    live.setLatLngs(stroke);
  }, { passive: false, capture: true });
  el.addEventListener('touchend', function (e) {
    if (!drawOn || !stroke) return;
    e.preventDefault(); e.stopPropagation();
    window.ReactNativeWebView.postMessage(JSON.stringify(stroke.map(function (p) { return { latitude: p[0], longitude: p[1] }; })));
    stroke = null;
  }, { passive: false, capture: true });

  window.setDraw = function (on) {
    drawOn = on;
    if (on) { map.dragging.disable(); map.touchZoom.disable(); }
    else { map.dragging.enable(); map.touchZoom.enable(); }
  };
  window.render = function (d) {
    if (live) { live.remove(); live = null; }
    layer.clearLayers();
    d.others.forEach(function (line) {
      L.polyline(line.map(function (p) { return [p.latitude, p.longitude]; }), { color: '#8C7BB8', weight: 4, opacity: 0.7, dashArray: '6 6' }).addTo(layer);
    });
    var leg = d.leg.map(function (p) { return [p.latitude, p.longitude]; });
    L.polyline(leg, { color: '#F5B841', weight: 6 }).addTo(layer);
    d.coins.forEach(function (c) {
      L.marker([c.latitude, c.longitude], { icon: L.divIcon({ className: '', iconSize: [14, 14], iconAnchor: [7, 7], html: '<div class="dot"></div>' }) }).addTo(layer);
    });
    d.tags.forEach(function (t) {
      L.marker([t.latitude, t.longitude], { icon: L.divIcon({ className: '', iconSize: [90, 44], iconAnchor: [45, 30],
        html: '<div class="tag" style="color:' + (t.active ? '#B8560B' : '#5B4B85') + '"><b>📦</b>' + t.label + '</div>' }) }).addTo(layer);
    });
    if (d.me) L.marker([d.me.latitude, d.me.longitude], { icon: L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="me"></div>' }) }).addTo(layer);
    if (lastLeg !== d.legKey && leg.length) {
      map.fitBounds(leg, { padding: [50, 50], maxZoom: 19 });
      lastLeg = d.legKey;
    }
  };
  window.ReactNativeWebView.postMessage('ready');
</script></body></html>`;

type Leg = { tag: TagCode; fromLabel: string; from: SpotLocation; to: SpotLocation };

// Keeps a point only when it's at least this far from the last one kept.
function thin(points: SpotLocation[], minM: number): SpotLocation[] {
  const out: SpotLocation[] = [];
  for (const p of points) if (!out.length || distanceM(out[out.length - 1], p) >= minM) out.push(p);
  return out;
}

export function PathDrawer({
  course,
  spots,
  paths,
  onChange,
  onClose,
}: {
  course: Game;
  spots: Spots;
  paths: Paths;
  onChange: (paths: Paths) => void;
  onClose: () => void;
}) {
  const web = useRef<ComponentRef<typeof WebView>>(null);
  const [ready, setReady] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [walking, setWalking] = useState(false);
  const [me, setMe] = useState<SpotLocation | null>(null);

  // Every stretch with a spot at both ends.
  const legs: Leg[] = course.checkpoints.flatMap((cp, i) => {
    const prevTag = course.checkpoints[i - 1]?.tag;
    const from = prevTag ? spots[prevTag] : course.startSpot;
    const to = spots[cp.tag];
    if (!from || !to) return [];
    return [{ tag: cp.tag, fromLabel: prevTag ? TAG_LABELS[prevTag] : 'the start', from, to }];
  });
  const [index, setIndex] = useState(0);
  const leg = legs[Math.min(index, legs.length - 1)];

  const latest = useRef({ paths, leg, onChange });
  latest.current = { paths, leg, onChange };

  const setLegPath = (points: SpotLocation[]) => {
    const { paths: p, leg: l, onChange: change } = latest.current;
    if (!l) return;
    const next = { ...p };
    if (points.length) next[l.tag] = points;
    else delete next[l.tag];
    change(next);
  };

  // A new stroke that starts near where the last one ended keeps going from
  // there (handy for long stretches). Otherwise it replaces the old path.
  const onStroke = (stroke: SpotLocation[]) => {
    const { paths: p, leg: l } = latest.current;
    if (!l || stroke.length < 2) return;
    const old = p[l.tag] ?? [];
    const joined = old.length && distanceM(old[old.length - 1], stroke[0]) <= 25 ? [...old, ...stroke] : stroke;
    setLegPath(thin(joined, 3));
  };

  useEffect(() => {
    if (!ready || !leg) return;
    const others = legs.filter((l) => l.tag !== leg.tag).map((l) => [l.from, ...(paths[l.tag] ?? []), l.to]);
    const coins = coinsForLeg(leg.tag, leg.from, leg.to, paths[leg.tag]).filter((c) => c.good);
    const tags = course.checkpoints.flatMap((cp) => {
      const s = spots[cp.tag];
      return s ? [{ ...s, label: TAG_LABELS[cp.tag].replace('Tag ', '').replace(' (final boss)', ''), active: cp.tag === leg.tag || leg.from === s }] : [];
    });
    const data = { others, leg: [leg.from, ...(paths[leg.tag] ?? []), leg.to], coins, tags, me, legKey: leg.tag };
    web.current?.injectJavaScript(`window.render(${JSON.stringify(data)}); true;`);
  }, [ready, leg?.tag, paths, me, spots]);

  useEffect(() => {
    if (ready) web.current?.injectJavaScript(`window.setDraw(${drawing}); true;`);
  }, [ready, drawing]);

  // Record as I walk: add a point every few steps.
  useEffect(() => {
    if (!walking) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || cancelled) return;
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 4, timeInterval: 2000 }, (loc) => {
        const here = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setMe(here);
        if ((loc.coords.accuracy ?? 0) > 20) return; // too fuzzy to trust
        const { paths: p, leg: l } = latest.current;
        if (!l) return;
        setLegPath(thin([...(p[l.tag] ?? []), here], 4));
      });
      if (cancelled) sub.remove();
    })().catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [walking]);

  if (!leg) {
    return (
      <Screen>
        <Title>Walking paths</Title>
        <Body>Set where at least two tags are hidden first. Then you can draw the path between them.</Body>
        <Button title="Back" onPress={onClose} />
      </Screen>
    );
  }

  const go = (d: number) => {
    setWalking(false);
    setIndex((i) => Math.max(0, Math.min(legs.length - 1, i + d)));
  };
  const hasPath = !!paths[leg.tag]?.length;

  return (
    // The page can't scroll while drawing, or a finger stroke would scroll it.
    <Screen scrollEnabled={!drawing}>
      <Title>Walking paths</Title>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 56 }}>
          <Button kind="secondary" title="◀" onPress={() => go(-1)} disabled={index === 0} />
        </View>
        <Body style={{ flex: 1, textAlign: 'center', fontWeight: '800' }}>
          From {leg.fromLabel} to {TAG_LABELS[leg.tag]}
        </Body>
        <View style={{ width: 56 }}>
          <Button kind="secondary" title="▶" onPress={() => go(1)} disabled={index >= legs.length - 1} />
        </View>
      </View>
      <Body style={{ color: colors.muted, fontSize: 14 }}>
        {drawing
          ? 'Trace the sidewalk with your finger, from one box to the next. Lift your finger and draw again to keep going.'
          : 'Tap ✏️ Draw, then trace the way people should walk. The gold dots show where the goodies will be.'}
      </Body>
      <View style={{ height: 420, borderRadius: 16, overflow: 'hidden', borderWidth: drawing ? 3 : 0, borderColor: colors.gold }}>
        <WebView
          ref={web}
          source={{ html: HTML, baseUrl: 'https://neocaching.local/' }}
          originWhitelist={['*']}
          onMessage={(e: WebViewMessageEvent) => {
            const data = e.nativeEvent.data;
            if (data === 'ready') setReady(true);
            else onStroke(JSON.parse(data));
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button title={drawing ? '✋ Move the map' : '✏️ Draw'} onPress={() => setDrawing(!drawing)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button kind="secondary" title="🗑️ Clear" onPress={() => setLegPath([])} disabled={!hasPath} />
        </View>
      </View>
      <Card>
        <Body style={{ fontWeight: '800' }}>Or record it as you walk</Body>
        <Body style={{ color: colors.muted, fontSize: 14 }}>
          Stand at {leg.fromLabel}, tap Start, and walk to {TAG_LABELS[leg.tag]}. Clear first if you want to start fresh.
        </Body>
        <Button kind={walking ? 'primary' : 'secondary'} title={walking ? '⏹️ Stop recording' : '🚶 Start recording'} onPress={() => setWalking(!walking)} />
      </Card>
      <Body style={{ color: colors.muted, fontSize: 14 }}>{hasPath ? '✅ This stretch has a path. It saves by itself.' : 'No path yet, so the goodies run in a straight line.'}</Body>
      <Button kind="secondary" title="Done" onPress={onClose} />
    </Screen>
  );
}
