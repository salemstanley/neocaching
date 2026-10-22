import { ComponentRef, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SpotLocation } from '../game/types';
import { getHere } from '../lib/location';
import { Body, Button, colors } from './ui';

// Tap the map to choose where a tag is hidden. Lets you plan a course from
// home instead of walking to each spot.
const HTML = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: #1B1035; }
  .pin { font-size: 30px; }
  .other { font: 700 11px sans-serif; color: #B9A9DA; text-align: center; white-space: nowrap; }
</style></head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: true }).setView([37.0965, -113.5684], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20, subdomains: 'abcd', attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
  var pin = null;
  var others = L.layerGroup().addTo(map);
  function setPin(lat, lng) {
    if (pin) pin.remove();
    pin = L.marker([lat, lng], { icon: L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 28], html: '<div class="pin">📍</div>' }) }).addTo(map);
  }
  map.on('click', function (e) {
    setPin(e.latlng.lat, e.latlng.lng);
    window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
  });
  window.show = function (d) {
    others.clearLayers();
    d.others.forEach(function (o) {
      L.marker([o.latitude, o.longitude], { icon: L.divIcon({ className: '', iconSize: [60, 30], iconAnchor: [30, 15],
        html: '<div class="other">📦<br>' + o.label + '</div>' }) }).addTo(others);
    });
    if (d.pin) { setPin(d.pin.latitude, d.pin.longitude); map.setView([d.pin.latitude, d.pin.longitude], 18); }
    else if (d.center) map.setView([d.center.latitude, d.center.longitude], 17);
  };
  window.ReactNativeWebView.postMessage('ready');
</script></body></html>`;

export function MapPicker({
  initial,
  others,
  onPick,
}: {
  initial: SpotLocation | undefined;
  others: (SpotLocation & { label: string })[];
  onPick: (spot: SpotLocation) => void;
}) {
  const web = useRef<ComponentRef<typeof WebView>>(null);
  const [ready, setReady] = useState(false);

  const show = (center: SpotLocation | null) =>
    web.current?.injectJavaScript(`window.show(${JSON.stringify({ others, pin: initial ?? null, center })}); true;`);

  useEffect(() => {
    if (!ready) return;
    if (initial) show(null);
    else getHere().then((h) => show(h.coords)).catch(() => show(null));
  }, [ready]);

  const centerOnMe = async () => {
    try {
      const h = await getHere();
      web.current?.injectJavaScript(`map.setView([${h.coords.latitude}, ${h.coords.longitude}], 18); true;`);
    } catch {
      // location unavailable; leave the map where it is
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Body style={{ color: colors.muted, fontSize: 14 }}>Tap the map where the tag will be hidden.</Body>
      <View style={{ height: 380, borderRadius: 16, overflow: 'hidden' }}>
        <WebView
          ref={web}
          source={{ html: HTML, baseUrl: 'https://neocaching.local/' }}
          originWhitelist={['*']}
          onMessage={(e: WebViewMessageEvent) => {
            const data = e.nativeEvent.data;
            if (data === 'ready') setReady(true);
            else onPick(JSON.parse(data));
          }}
        />
      </View>
      <Button kind="secondary" title="Center the map on me" onPress={centerOnMe} />
    </View>
  );
}
