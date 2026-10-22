import { ComponentRef, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SpotLocation } from '../game/types';
import { bearingDeg } from '../lib/location';

export type MapCache = SpotLocation & { label: string; status: 'found' | 'next' | 'later' };

// A small Leaflet map in a web view: caches as pins, you as a blue dot, and
// (if turned on) an arrow on your dot pointing to the next cache. Coins are
// never shown. Map tiles come from CARTO, which needs no account or key.
const HTML = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: #1B1035; }
  .cache { font: 700 12px sans-serif; color: #fff; text-align: center; white-space: nowrap; }
  .cache b { display: block; font-size: 26px; line-height: 28px; }
  .me { width: 18px; height: 18px; border-radius: 50%; background: #2F80FF; border: 3px solid #fff; box-shadow: 0 0 8px #2F80FF; }
  .arrow { font-size: 30px; color: #F5B841; text-shadow: 0 0 4px #000; transform-origin: 50% 50%; }
</style></head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false, attributionControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var fitted = false;
  var icons = { found: '✅', next: '📦', later: '📦' };
  window.render = function (d) {
    layer.clearLayers();
    var pts = [];
    d.caches.forEach(function (c) {
      var color = c.status === 'next' ? '#F5B841' : c.status === 'found' ? '#5CD38A' : '#B9A9DA';
      L.marker([c.latitude, c.longitude], { icon: L.divIcon({ className: '', iconSize: [80, 48], iconAnchor: [40, 30],
        html: '<div class="cache" style="color:' + color + '"><b>' + icons[c.status] + '</b>' + c.label + '</div>' }) }).addTo(layer);
      pts.push([c.latitude, c.longitude]);
    });
    if (d.me) {
      L.marker([d.me.latitude, d.me.longitude], { icon: L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 12], html: '<div class="me"></div>' }) }).addTo(layer);
      if (d.arrow !== null) {
        L.marker([d.me.latitude, d.me.longitude], { icon: L.divIcon({ className: '', iconSize: [40, 40], iconAnchor: [20, 46],
          html: '<div class="arrow" style="transform: rotate(' + d.arrow + 'deg)">▲</div>' }) }).addTo(layer);
      }
      pts.push([d.me.latitude, d.me.longitude]);
    }
    if (!fitted && pts.length) {
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 19 });
      fitted = true;
    }
  };
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
</script></body></html>`;

export function CacheMap({
  caches,
  me,
  arrowTo,
}: {
  caches: MapCache[];
  me: SpotLocation | null;
  // The next cache's spot when the arrow is on, otherwise null.
  arrowTo: SpotLocation | null;
}) {
  const web = useRef<ComponentRef<typeof WebView>>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const arrow = me && arrowTo ? bearingDeg(me, arrowTo) : null;
    web.current?.injectJavaScript(`window.render(${JSON.stringify({ caches, me, arrow })}); true;`);
  }, [ready, caches, me, arrowTo]);

  return (
    <View style={{ height: 360, borderRadius: 16, overflow: 'hidden' }}>
      <WebView
        ref={web}
        source={{ html: HTML, baseUrl: 'https://neocaching.local/' }}
        originWhitelist={['*']}
        onMessage={(e: WebViewMessageEvent) => e.nativeEvent.data === 'ready' && setReady(true)}
        style={{ backgroundColor: '#1B1035' }}
      />
    </View>
  );
}
