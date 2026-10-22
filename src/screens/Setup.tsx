import { useEffect, useState } from 'react';
import { Switch, TextInput, View } from 'react-native';
import { TAG_CODES, TAG_LABELS as LABELS, TagCode } from '../game/types';
import { cancelScan, nfcStatus, writeTagCode } from '../lib/nfc';
import { Settings, loadSettings, saveSettings } from '../lib/storage';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

// Write the 6 physical tags (they work with every course) and change settings.
// Where each tag is hidden is set per course, in the course editor.
export function Setup({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<Settings>({ skipGps: false, playerName: '', anthropicKey: '' });
  const [busy, setBusy] = useState<TagCode | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
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
    setBusy(tag);
    try {
      await writeTagCode(tag);
      setMessage(`✅ Tag is now ${LABELS[tag]}.`);
    } catch {
      setMessage('Writing failed or was cancelled. Hold the phone still on the tag and try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Title>Tags and settings</Title>
      <Body style={{ color: colors.muted }}>
        You only need to write each tag once. The same 6 tags work with every course. Tap a button and hold a blank tag to the back of your phone.
      </Body>

      {message && <Body style={{ color: colors.gold }}>{message}</Body>}

      <Card>
        {TAG_CODES.map((tag) => (
          <Button
            key={tag}
            title={busy === tag ? 'Hold the tag to your phone…' : `Write ${LABELS[tag]}`}
            onPress={() => (busy === tag ? cancelScan() : write(tag))}
            disabled={!!busy && busy !== tag}
          />
        ))}
      </Card>

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

      <Card>
        <Body style={{ fontWeight: '800' }}>Claude API key (for the course wizard)</Body>
        <Body style={{ color: colors.muted, fontSize: 14 }}>
          Lets the app ask Claude to write a story, clues and games for you. Get a key at console.anthropic.com. It stays on this phone and is never shared with a course.
        </Body>
        <TextInput
          value={settings.anthropicKey}
          onChangeText={(t) => updateSettings({ ...settings, anthropicKey: t.trim() })}
          placeholder="sk-ant-..."
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={{ backgroundColor: colors.bg, color: colors.text, fontSize: 16, borderRadius: 12, padding: 12 }}
        />
      </Card>

      <Button kind="secondary" title="Back" onPress={onBack} />
    </Screen>
  );
}
