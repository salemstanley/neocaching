import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Game, MAX_TAGS, MIN_TAGS, MiniGameKind, SpotLocation, TAG_LABELS, TagCode, tagsForCount } from '../game/types';
import { WizardInput, explainError, writeCourse } from '../lib/ai';
import { getHere } from '../lib/location';
import { Spots, loadSettings, saveCustomCourse, saveSpots } from '../lib/storage';
import { Chip, Field, Toggle } from '../components/form';
import { MapPicker } from '../components/MapPicker';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

const DRAFT_KEY = 'wizardDraft';
const OCCASIONS = ['Birthday', 'Date night', 'Family fun', 'Party'];
const CHALLENGES: { kind: MiniGameKind | 'surprise'; label: string }[] = [
  { kind: 'surprise', label: 'Surprise me' },
  { kind: 'trivia', label: 'Trivia' },
  { kind: 'speedTap', label: 'Speed tap' },
  { kind: 'memory', label: 'Memory' },
  { kind: 'wordSearch', label: 'Word search' },
  { kind: 'merge', label: 'Merge (2048)' },
  { kind: 'match3', label: 'Match 3' },
  { kind: 'catch', label: 'Catch' },
  { kind: 'activity', label: 'Activity' },
];

const blankStop = () => ({ hidingSpot: '', activityIdea: '', challenge: 'surprise' as const });

type Draft = WizardInput & { spots: Spots };

const EMPTY: Draft = {
  players: '',
  occasion: '',
  storyIdea: '',
  extraNotes: '',
  timed: true,
  stops: tagsForCount(6).map(blankStop),
  spots: {},
};

// Answer a few questions while you hide the tags, and Claude writes the story,
// clues and challenges. The finished course opens in the editor for changes.
export function CourseWizard({
  onCreated,
  onOpenSettings,
  onBack,
}: {
  onCreated: (course: Game) => void;
  onOpenSettings: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [mapFor, setMapFor] = useState<TagCode | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(true);

  // Keep answers if the app closes while you're out hiding tags.
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => raw && setDraft({ ...EMPTY, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setLoaded(true));
    loadSettings().then((s) => setHasKey(!!s.anthropicKey));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
  }, [draft, loaded]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setStop = (i: number, patch: Partial<Draft['stops'][number]>) =>
    setDraft((d) => ({ ...d, stops: d.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const tags = tagsForCount(draft.stops.length);
  const setTagCount = (n: number) => {
    if (n < MIN_TAGS || n > MAX_TAGS) return;
    setDraft((d) => {
      // Keep the finale's answers on the last stop.
      const middle = d.stops.slice(0, -1);
      const last = d.stops[d.stops.length - 1];
      const stops = [...Array.from({ length: n - 1 }, (_, i) => middle[i] ?? blankStop()), last];
      return { ...d, stops, spots: {} };
    });
  };
  const setSpot = (tag: TagCode, spot: SpotLocation) => setDraft((d) => ({ ...d, spots: { ...d.spots, [tag]: spot } }));

  const saveHere = async (tag: TagCode) => {
    setMessage('Getting your location…');
    try {
      const here = await getHere();
      setSpot(tag, { latitude: here.coords.latitude, longitude: here.coords.longitude });
      setMessage(`📍 Saved ${TAG_LABELS[tag]} where you're standing.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not get your location.');
    }
  };

  const create = async () => {
    const settings = await loadSettings();
    if (!settings.anthropicKey) {
      setHasKey(false);
      return;
    }
    setMessage(null);
    setWorking(true);
    try {
      const { spots, ...input } = draft;
      const course = await writeCourse(settings.anthropicKey, input);
      await saveCustomCourse(course);
      await saveSpots(course.id, spots);
      await AsyncStorage.removeItem(DRAFT_KEY);
      onCreated(course);
    } catch (e) {
      setMessage(explainError(e));
    } finally {
      setWorking(false);
    }
  };

  if (working) {
    return (
      <Screen>
        <Title>Writing your adventure…</Title>
        <Card style={{ alignItems: 'center' }}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Body style={{ textAlign: 'center' }}>Claude is writing the story, clues and challenges. This can take a minute or two.</Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Course wizard</Title>
      <Body style={{ color: colors.muted }}>
        Tell Claude about the adventure and where you hid each tag. It writes the story, clues and challenges, and you can change anything afterward.
      </Body>

      {!hasKey && (
        <Card style={{ borderWidth: 2, borderColor: colors.bad }}>
          <Body>The wizard needs a Claude API key first. Add it under Write tags and settings.</Body>
          <Button title="Add my key" onPress={onOpenSettings} />
        </Card>
      )}

      <Card>
        <Field label="Who's playing? (names and ages)" value={draft.players} onChange={(players) => set({ players })} placeholder="e.g. Lily, turning 9" />
        <Body style={{ color: colors.muted, fontSize: 14 }}>What's the occasion?</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OCCASIONS.map((o) => (
            <Chip key={o} label={o} selected={draft.occasion === o} onPress={() => set({ occasion: o })} />
          ))}
        </View>
        <Field label="Or describe it" value={draft.occasion} onChange={(occasion) => set({ occasion })} />
        <Field
          label="Story idea"
          value={draft.storyIdea}
          onChange={(storyIdea) => set({ storyIdea })}
          placeholder="e.g. A unicorn lost her birthday crown and needs Lily's help"
          multiline
        />
        <Field
          label="Anything else Claude should know? (optional)"
          value={draft.extraNotes}
          onChange={(extraNotes) => set({ extraNotes })}
          placeholder="Favorite things, inside jokes, how hard the clues should be"
          multiline
        />
        <Body style={{ color: colors.muted, fontSize: 14 }}>How many tags? ({MIN_TAGS} to {MAX_TAGS}, the last one is the grand finale)</Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 70 }}>
            <Button kind="secondary" title="−" onPress={() => setTagCount(draft.stops.length - 1)} disabled={draft.stops.length <= MIN_TAGS} />
          </View>
          <Body style={{ color: colors.gold, fontSize: 28, fontWeight: '800', minWidth: 40, textAlign: 'center' }}>{String(draft.stops.length)}</Body>
          <View style={{ width: 70 }}>
            <Button kind="secondary" title="+" onPress={() => setTagCount(draft.stops.length + 1)} disabled={draft.stops.length >= MAX_TAGS} />
          </View>
        </View>
        <Body style={{ color: colors.muted, fontSize: 13 }}>Changing this clears the spots you saved below.</Body>
        <Toggle label="Timed race" hint="Turn off for a relaxed pace, like a date." value={draft.timed} onChange={(timed) => set({ timed })} />
      </Card>

      {message && <Body style={{ color: colors.gold }}>{message}</Body>}

      {tags.map((tag, i) => {
        const stop = draft.stops[i];
        const spot = draft.spots[tag];
        return (
          <Card key={tag}>
            <Body style={{ fontWeight: '800' }}>{TAG_LABELS[tag]}</Body>
            <Field
              label="Where is it hidden?"
              value={stop.hidingSpot}
              onChange={(hidingSpot) => setStop(i, { hidingSpot })}
              placeholder="e.g. Under the red slide at the park"
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title={spot ? '📍 Spot saved' : "I'm here"} onPress={() => saveHere(tag)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button kind="secondary" title={mapFor === tag ? 'Hide map' : 'Pick on map'} onPress={() => setMapFor(mapFor === tag ? null : tag)} />
              </View>
            </View>
            {mapFor === tag && <MapPicker initial={spot} others={[]} onPick={(s) => setSpot(tag, s)} />}
            <Field
              label="Something to do here? (optional)"
              value={stop.activityIdea}
              onChange={(activityIdea) => setStop(i, { activityIdea })}
              placeholder="e.g. Eat dinner at Cafe Rio"
            />
            <Body style={{ color: colors.muted, fontSize: 14 }}>Challenge</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CHALLENGES.map((c) => (
                <Chip key={c.kind} label={c.label} selected={stop.challenge === c.kind} onPress={() => setStop(i, { challenge: c.kind })} />
              ))}
            </View>
          </Card>
        );
      })}

      <Button title="✨ Write my adventure" onPress={create} />
      <Body style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>Uses a little of your Claude API credit (usually well under a dollar).</Body>
      <Button kind="secondary" title="Start over" onPress={() => setDraft(EMPTY)} />
      <Button kind="secondary" title="Back" onPress={onBack} />
    </Screen>
  );
}
