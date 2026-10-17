import { useEffect, useState } from 'react';
import { Switch, TextInput, View } from 'react-native';
import { TAG_CODES, TAG_LABELS as LABELS, TagCode } from '../game/types';
import { getHere } from '../lib/location';
import { cancelScan, nfcStatus, writeTagCode } from '../lib/nfc';
import { Settings, Spots, loadSettings, loadSpots, saveSettings, saveSpots } from '../lib/storage';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';


// Walk your loop with the tags: write each tag, stick it up, then save the spot.
export function Setup({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<Settings>({ skipGps: false, playerName: '' });
  const [spots, setSpots] = useState<Spots>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
    loadSpots().then(setSpots);
    return () => cancelScan();
  }, []);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  const write = async (tag: TagCode) => {
    setMessage(null);
    const status = await nfcStatus();
    if (status !== 'ok') return setMessage(status === 'off' ? 'Turn on NFC in your phone settings first.' : 'This phone cannot use NFC.');
    setBusy(`write-${tag}`);
    try {
      await writeTagCode(tag);
      setMessage(`✅ Tag is now ${LABELS[tag]}.`);
    } catch {
      setMessage('Writing failed or was cancelled. Hold the phone still on the tag and try again.');
    } finally {
      setBusy(null);
    }
  };

  const saveSpot = async (tag: TagCode) => {
    setMessage(null);
    setBusy(`spot-${tag}`);
    try {
      const here = await getHere();
      const next = { ...spots, [tag]: { latitude: here.coords.latitude, longitude: here.coords.longitude } };
      setSpots(next);
      await saveSpots(next);
      setMessage(`📍 Saved this spot for ${LABELS[tag]} (accurate to about ${Math.round(here.coords.accuracy ?? 0)} m).`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not get your location.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Title>Set up</Title>
      <Body style={{ color: colors.muted }}>
        For each tag: tap Write tag and hold a blank tag to the back of your phone. Stick the tag in its spot, stand next to it, and tap Save spot.
      </Body>

      {message && <Body style={{ color: colors.gold }}>{message}</Body>}

      {TAG_CODES.map((tag) => {
        const spot = spots[tag];
        return (
          <Card key={tag}>
            <Body style={{ fontWeight: '800' }}>{LABELS[tag]}</Body>
            <Body style={{ color: colors.muted, fontSize: 14 }}>
              {spot ? `📍 ${spot.latitude.toFixed(5)}, ${spot.longitude.toFixed(5)}` : 'Spot not saved yet (GPS check is skipped)'}
            </Body>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title={busy === `write-${tag}` ? 'Hold to tag…' : 'Write tag'}
                  onPress={() => (busy === `write-${tag}` ? cancelScan() : write(tag))}
                  disabled={!!busy && busy !== `write-${tag}`}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  kind="secondary"
                  title={busy === `spot-${tag}` ? 'Locating…' : 'Save spot'}
                  onPress={() => saveSpot(tag)}
                  disabled={!!busy}
                />
              </View>
            </View>
          </Card>
        );
      })}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Body style={{ flex: 1 }}>Skip the GPS check (for testing at home)</Body>
          <Switch
            value={settings.skipGps}
            onValueChange={(v) => updateSettings({ ...settings, skipGps: v })}
            trackColor={{ true: colors.gold }}
          />
        </View>
        <TextInput
          value={settings.playerName}
          onChangeText={(t) => updateSettings({ ...settings, playerName: t })}
          placeholder="Your player name"
          placeholderTextColor={colors.muted}
          maxLength={20}
          style={{ backgroundColor: colors.bg, color: colors.text, fontSize: 18, borderRadius: 12, padding: 12 }}
        />
      </Card>

      <Button kind="secondary" title="Back" onPress={onBack} />
    </Screen>
  );
}
