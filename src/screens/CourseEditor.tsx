import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Checkpoint, Game, MiniGame, MiniGameKind, SpotLocation, TAG_LABELS, TagCode, TriviaQuestion } from '../game/types';
import { getHere } from '../lib/location';
import { shareCourse } from '../lib/share';
import { Spots, deleteCustomCourse, loadSpots, saveCustomCourse, saveSpots } from '../lib/storage';
import { MapPicker } from '../components/MapPicker';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

const KIND_LABELS: Record<MiniGameKind, string> = {
  trivia: 'Trivia',
  speedTap: 'Speed tap',
  memory: 'Memory match',
  activity: 'Real-world activity',
};

const DEFAULT_GAMES: Record<MiniGameKind, MiniGame> = {
  trivia: { kind: 'trivia', questions: [{ question: '', answers: ['', '', '', ''], correctIndex: 0 }] },
  speedTap: { kind: 'speedTap', taps: 30, seconds: 10, label: 'Tap tap tap!' },
  memory: { kind: 'memory', symbols: ['🎂', '🎈', '🎁', '🎉', '🍕', '🦄'], seconds: 60 },
  activity: { kind: 'activity', task: '' },
};

// Make or change a course: its story, each stop's challenge and clue, and
// where each tag is hidden.
export function CourseEditor({
  initial,
  onChanged,
  onCopy,
  onBack,
}: {
  initial: Game;
  onChanged: () => void;
  onCopy: (course: Game) => void;
  onBack: () => void;
}) {
  const [course, setCourse] = useState(initial);
  const [spots, setSpots] = useState<Spots>({});
  const [open, setOpen] = useState<TagCode | null>(null);
  const [mapFor, setMapFor] = useState<TagCode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const editable = !!course.custom;
  const firstRender = useRef(true);

  useEffect(() => {
    loadSpots(course.id).then(setSpots);
  }, [course.id]);

  // Save a moment after each change.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!editable) return;
    const id = setTimeout(() => saveCustomCourse(course).then(onChanged), 500);
    return () => clearTimeout(id);
  }, [course]);

  const set = (patch: Partial<Game>) => setCourse((c) => ({ ...c, ...patch }));
  const setStop = (tag: TagCode, patch: Partial<Checkpoint>) =>
    setCourse((c) => ({ ...c, checkpoints: c.checkpoints.map((cp) => (cp.tag === tag ? { ...cp, ...patch } : cp)) }));

  const setSpot = async (tag: TagCode, spot: SpotLocation) => {
    const next = { ...spots, [tag]: spot };
    setSpots(next);
    await saveSpots(course.id, next);
  };

  const saveHere = async (tag: TagCode) => {
    setMessage('Getting your location…');
    try {
      const here = await getHere();
      await setSpot(tag, { latitude: here.coords.latitude, longitude: here.coords.longitude });
      setMessage(`📍 Saved ${TAG_LABELS[tag]} where you're standing (accurate to about ${Math.round(here.coords.accuracy ?? 0)} m).`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not get your location.');
    }
  };

  const remove = () =>
    Alert.alert('Delete this course?', `"${course.title}" will be gone for good.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomCourse(course.id);
          onChanged();
          onBack();
        },
      },
    ]);

  const savedSpots = course.checkpoints.flatMap((cp) => {
    const s = spots[cp.tag];
    return s ? [{ ...s, label: TAG_LABELS[cp.tag] }] : [];
  });

  return (
    <Screen>
      <Title>{editable ? 'Edit course' : course.title}</Title>
      {!editable && (
        <Card>
          <Body>This course comes with the app. You can choose where its tags go. To change the story, make your own copy.</Body>
          <Button kind="secondary" title="Make an editable copy" onPress={() => onCopy(course)} />
        </Card>
      )}

      {editable && (
        <Card>
          <Field label="Course name" value={course.title} onChange={(title) => set({ title })} />
          <Field label="One-line description" value={course.tagline} onChange={(tagline) => set({ tagline })} />
          <Field label="Opening story" value={course.intro} onChange={(intro) => set({ intro })} multiline />
          <Field label="Clue to the Start tag" value={course.startClue} onChange={(startClue) => set({ startClue })} multiline />
          <Field label="Ending story" value={course.ending} onChange={(ending) => set({ ending })} multiline />
          <Toggle
            label="Timed"
            hint="Turn off for relaxed adventures like a date night."
            value={course.timed !== false}
            onChange={(timed) => set({ timed })}
          />
          {course.timed !== false && (
            <Field
              label="Time bonus if finished within (minutes)"
              value={String(course.parMinutes ?? 15)}
              onChange={(v) => set({ parMinutes: Math.max(1, parseInt(v, 10) || 1) })}
              numeric
            />
          )}
        </Card>
      )}

      {message && <Body style={{ color: colors.gold }}>{message}</Body>}

      {course.checkpoints.map((cp, i) => {
        const spot = spots[cp.tag];
        const isOpen = open === cp.tag;
        const isLast = i === course.checkpoints.length - 1;
        return (
          <Card key={cp.tag}>
            <Pressable onPress={() => setOpen(isOpen ? null : cp.tag)}>
              <Body style={{ fontWeight: '800' }}>
                {isOpen ? '▾' : '▸'} {TAG_LABELS[cp.tag]}: {cp.title}
              </Body>
              <Body style={{ color: spot ? colors.good : colors.bad, fontSize: 14 }}>
                {spot ? `📍 Spot set (${spot.latitude.toFixed(5)}, ${spot.longitude.toFixed(5)})` : 'No spot set yet'}
              </Body>
            </Pressable>

            {isOpen && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button title="Use where I'm standing" onPress={() => saveHere(cp.tag)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      kind="secondary"
                      title={mapFor === cp.tag ? 'Hide map' : 'Pick on map'}
                      onPress={() => setMapFor(mapFor === cp.tag ? null : cp.tag)}
                    />
                  </View>
                </View>
                {mapFor === cp.tag && (
                  <MapPicker
                    initial={spot}
                    others={savedSpots.filter((s) => s.label !== TAG_LABELS[cp.tag])}
                    onPick={(s) => setSpot(cp.tag, s)}
                  />
                )}

                {editable && (
                  <>
                    <Field label="Stop name" value={cp.title} onChange={(title) => setStop(cp.tag, { title })} />
                    <Field label="Story at this stop" value={cp.story} onChange={(story) => setStop(cp.tag, { story })} multiline />
                    <Body style={{ fontWeight: '700' }}>Challenge</Body>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(Object.keys(KIND_LABELS) as MiniGameKind[]).map((kind) => (
                        <Chip
                          key={kind}
                          label={KIND_LABELS[kind]}
                          selected={cp.miniGame.kind === kind}
                          onPress={() => cp.miniGame.kind !== kind && setStop(cp.tag, { miniGame: DEFAULT_GAMES[kind] })}
                        />
                      ))}
                    </View>
                    <ChallengeFields game={cp.miniGame} onChange={(miniGame) => setStop(cp.tag, { miniGame })} />
                    <Field label="Message when they finish" value={cp.winText} onChange={(winText) => setStop(cp.tag, { winText })} multiline />
                    {cp.miniGame.kind !== 'activity' && (
                      <Field label="Message if they lose" value={cp.loseText} onChange={(loseText) => setStop(cp.tag, { loseText })} multiline />
                    )}
                    {!isLast && (
                      <Field
                        label={`Clue to ${TAG_LABELS[course.checkpoints[i + 1].tag]}`}
                        value={cp.clue ?? ''}
                        onChange={(clue) => setStop(cp.tag, { clue })}
                        multiline
                      />
                    )}
                  </>
                )}
              </View>
            )}
          </Card>
        );
      })}

      {editable && (
        <Body style={{ color: colors.muted, fontSize: 14 }}>Changes save automatically.</Body>
      )}
      <Button
        kind="secondary"
        title="Share this course"
        onPress={() => shareCourse(course, spots).catch(() => setMessage('Sharing was cancelled.'))}
      />
      {editable && <Button kind="secondary" title="Delete this course" onPress={remove} />}
      <Button title="Done" onPress={onBack} />
    </Screen>
  );
}

function ChallengeFields({ game, onChange }: { game: MiniGame; onChange: (g: MiniGame) => void }) {
  if (game.kind === 'activity') {
    return (
      <Field
        label="What should they do here?"
        value={game.task}
        onChange={(task) => onChange({ ...game, task })}
        placeholder="e.g. Order dessert and share it"
        multiline
      />
    );
  }
  if (game.kind === 'speedTap') {
    return (
      <>
        <Field label="Button text" value={game.label} onChange={(label) => onChange({ ...game, label })} />
        <Field label="Taps needed" value={String(game.taps)} onChange={(v) => onChange({ ...game, taps: Math.max(1, parseInt(v, 10) || 1) })} numeric />
        <Field label="Seconds allowed" value={String(game.seconds)} onChange={(v) => onChange({ ...game, seconds: Math.max(1, parseInt(v, 10) || 1) })} numeric />
      </>
    );
  }
  if (game.kind === 'memory') {
    return (
      <>
        <Field
          label="Card pictures (emoji, separated by spaces)"
          value={game.symbols.join(' ')}
          onChange={(v) => onChange({ ...game, symbols: v.split(/\s+/).filter(Boolean).slice(0, 8) })}
        />
        <Field label="Seconds allowed" value={String(game.seconds)} onChange={(v) => onChange({ ...game, seconds: Math.max(5, parseInt(v, 10) || 5) })} numeric />
      </>
    );
  }

  const setQuestion = (i: number, q: TriviaQuestion) =>
    onChange({ ...game, questions: game.questions.map((old, j) => (j === i ? q : old)) });
  return (
    <>
      {game.questions.map((q, i) => (
        <View key={i} style={{ gap: 8, borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: 10 }}>
          <Field label={`Question ${i + 1}`} value={q.question} onChange={(question) => setQuestion(i, { ...q, question })} multiline />
          {q.answers.map((a, j) => (
            <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => setQuestion(i, { ...q, correctIndex: j })}>
                <Text style={{ fontSize: 24 }}>{q.correctIndex === j ? '✅' : '⬜'}</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={a}
                  onChangeText={(t) => setQuestion(i, { ...q, answers: q.answers.map((old, k) => (k === j ? t : old)) })}
                  placeholder={`Answer ${j + 1}`}
                  placeholderTextColor={colors.muted}
                  style={inputStyle}
                />
              </View>
            </View>
          ))}
          <Body style={{ color: colors.muted, fontSize: 13 }}>Tap the box next to the right answer.</Body>
          {game.questions.length > 1 && (
            <Button kind="secondary" title="Remove this question" onPress={() => onChange({ ...game, questions: game.questions.filter((_, j) => j !== i) })} />
          )}
        </View>
      ))}
      <Button
        kind="secondary"
        title="Add a question"
        onPress={() => onChange({ ...game, questions: [...game.questions, { question: '', answers: ['', '', '', ''], correctIndex: 0 }] })}
      />
    </>
  );
}

const inputStyle = { backgroundColor: colors.bg, color: colors.text, fontSize: 16, borderRadius: 10, padding: 10 };

function Field({
  label,
  value,
  onChange,
  multiline,
  numeric,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  numeric?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Body style={{ color: colors.muted, fontSize: 14 }}>{label}</Body>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={numeric ? 'number-pad' : 'default'}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[inputStyle, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
        {hint && <Body style={{ color: colors.muted, fontSize: 14 }}>{hint}</Body>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.gold }} />
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: selected ? colors.gold : 'transparent',
        borderWidth: 2,
        borderColor: selected ? colors.gold : colors.muted,
      }}
    >
      <Text style={{ color: selected ? colors.bg : colors.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
