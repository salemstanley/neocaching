import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { resizeCourse } from '../game/template';
import { Checkpoint, Game, MAX_TAGS, MIN_TAGS, MiniGame, MiniGameKind, SpotLocation, TAG_LABELS, TagCode, TriviaQuestion } from '../game/types';
import { getHere } from '../lib/location';
import { shareCourse } from '../lib/share';
import { Photos, loadPhotos, pickHidingPhoto } from '../lib/photos';
import { Spots, deleteCustomCourse, loadCourseSpots, saveCustomCourse, saveSpots, spotsKey } from '../lib/storage';
import { Chip, Field, Toggle, inputStyle } from '../components/form';
import { MapPicker } from '../components/MapPicker';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

const KIND_LABELS: Record<MiniGameKind, string> = {
  trivia: 'Trivia',
  speedTap: 'Speed tap',
  memory: 'Memory match',
  activity: 'Real-world activity',
  wordSearch: 'Word search',
  merge: 'Merge (like 2048)',
  match3: 'Match 3',
  catch: 'Catch the falling things',
};

const DEFAULT_GAMES: Record<MiniGameKind, MiniGame> = {
  trivia: { kind: 'trivia', questions: [{ question: '', answers: ['', '', '', ''], correctIndex: 0 }] },
  speedTap: { kind: 'speedTap', taps: 30, seconds: 10, label: 'Tap tap tap!' },
  memory: { kind: 'memory', symbols: ['🎂', '🎈', '🎁', '🎉', '🍕', '🦄'], seconds: 60 },
  activity: { kind: 'activity', task: '' },
  wordSearch: { kind: 'wordSearch', words: ['PARTY', 'CAKE', 'GIFT', 'BALLOON', 'CANDLE'], size: 9, seconds: 120 },
  merge: { kind: 'merge', ladder: ['🌱', '🌿', '🌷', '💐', '🌳', '🏡'], goal: 4, seconds: 120 },
  match3: { kind: 'match3', pieces: ['🍎', '🍊', '🍋', '🍇', '🫐'], target: 40, moves: 20 },
  catch: { kind: 'catch', good: ['🎁', '🎈'], bad: ['💣'], target: 15, seconds: 30, speed: 1 },
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
  const [photos, setPhotos] = useState<Photos>({});
  const editable = !!course.custom;
  const firstRender = useRef(true);

  const sKey = spotsKey(course);
  useEffect(() => {
    loadCourseSpots(course).then(setSpots);
    loadPhotos(sKey).then(setPhotos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sKey]);

  const takePhoto = async (tag: TagCode, from: 'camera' | 'gallery') => {
    try {
      const updated = await pickHidingPhoto(sKey, tag, from);
      if (updated) {
        setPhotos(updated);
        setMessage(`📷 Saved the hiding-spot photo for ${TAG_LABELS[tag]}.`);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save the photo.');
    }
  };

  const setTagCount = (n: number) => {
    if (n < MIN_TAGS || n > MAX_TAGS) return;
    setCourse((c) => resizeCourse(c, n));
    setOpen(null);
  };

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
    await saveSpots(sKey, next);
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
          <Body style={{ color: colors.muted, fontSize: 14 }}>How many tags? ({MIN_TAGS} to {MAX_TAGS}, the last one is the final boss)</Body>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 70 }}>
              <Button kind="secondary" title="−" onPress={() => setTagCount(course.checkpoints.length - 1)} disabled={course.checkpoints.length <= MIN_TAGS} />
            </View>
            <Text style={{ color: colors.gold, fontSize: 28, fontWeight: '800', minWidth: 40, textAlign: 'center' }}>{course.checkpoints.length}</Text>
            <View style={{ width: 70 }}>
              <Button kind="secondary" title="+" onPress={() => setTagCount(course.checkpoints.length + 1)} disabled={course.checkpoints.length >= MAX_TAGS} />
            </View>
          </View>
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

      {course.spotsId && (
        <Body style={{ color: colors.muted, fontSize: 14 }}>
          Tag spots and photos you set here are shared by every version of this course.
        </Body>
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

                <Body style={{ fontWeight: '700' }}>Hiding-spot photo</Body>
                <Body style={{ color: colors.muted, fontSize: 14 }}>
                  Players can peek at this if they're stuck (it costs them points). Take it after you hide the tag.
                </Body>
                {photos[cp.tag] && (
                  <Image source={{ uri: photos[cp.tag] }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12 }} resizeMode="cover" />
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button title={photos[cp.tag] ? '📷 Retake photo' : '📷 Take photo'} onPress={() => takePhoto(cp.tag, 'camera')} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button kind="secondary" title="From gallery" onPress={() => takePhoto(cp.tag, 'gallery')} />
                  </View>
                </View>

                {editable && (
                  <>
                    <Field label="Stop name" value={cp.title} onChange={(title) => setStop(cp.tag, { title })} />
                    <Field label="Story at this stop" value={cp.story} onChange={(story) => setStop(cp.tag, { story })} multiline />
                    <Field
                      label="What floats in the camera here? (one emoji, leave empty for the star)"
                      value={cp.prize?.emoji ?? ''}
                      onChange={(emoji) => setStop(cp.tag, { prize: emoji.trim() ? { emoji: emoji.trim(), name: cp.prize?.name || 'a prize' } : undefined })}
                    />
                    {cp.prize && (
                      <Field
                        label="What is it called? (e.g. a bowl of mashed potatoes)"
                        value={cp.prize.name}
                        onChange={(name) => setStop(cp.tag, { prize: { emoji: cp.prize!.emoji, name } })}
                      />
                    )}
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

  if (game.kind === 'wordSearch') {
    return (
      <>
        <Field
          label="Words to find (separated by spaces)"
          value={game.words.join(' ')}
          onChange={(v) => onChange({ ...game, words: v.toUpperCase().split(/\s+/).filter(Boolean).slice(0, 10) })}
        />
        <Field label="Grid size (6 to 12 letters across)" value={String(game.size)} onChange={(v) => onChange({ ...game, size: Math.max(6, Math.min(12, parseInt(v, 10) || 6)) })} numeric />
        <Toggle label="Diagonal words too" hint="Harder." value={!!game.diagonal} onChange={(diagonal) => onChange({ ...game, diagonal })} />
        <Field label="Seconds allowed" value={String(game.seconds)} onChange={(v) => onChange({ ...game, seconds: Math.max(10, parseInt(v, 10) || 10) })} numeric />
      </>
    );
  }
  if (game.kind === 'merge') {
    return (
      <>
        <Field
          label="Items from smallest to biggest (emoji, separated by spaces)"
          value={game.ladder.join(' ')}
          onChange={(v) => onChange({ ...game, ladder: v.split(/\s+/).filter(Boolean).slice(0, 10) })}
        />
        <Field
          label="Win by making item number (2 is easy, 5 is hard)"
          value={String(game.goal + 1)}
          onChange={(v) => onChange({ ...game, goal: Math.max(1, Math.min(game.ladder.length - 1, (parseInt(v, 10) || 2) - 1)) })}
          numeric
        />
        <Field label="Seconds allowed" value={String(game.seconds)} onChange={(v) => onChange({ ...game, seconds: Math.max(10, parseInt(v, 10) || 10) })} numeric />
      </>
    );
  }
  if (game.kind === 'match3') {
    return (
      <>
        <Field
          label="Pieces (4 to 6 emoji, separated by spaces; fewer is easier)"
          value={game.pieces.join(' ')}
          onChange={(v) => onChange({ ...game, pieces: v.split(/\s+/).filter(Boolean).slice(0, 6) })}
        />
        <Field label="Pieces to clear" value={String(game.target)} onChange={(v) => onChange({ ...game, target: Math.max(3, parseInt(v, 10) || 3) })} numeric />
        <Field label="Moves allowed" value={String(game.moves)} onChange={(v) => onChange({ ...game, moves: Math.max(1, parseInt(v, 10) || 1) })} numeric />
      </>
    );
  }
  if (game.kind === 'catch') {
    return (
      <>
        <Field label="Things to catch (emoji)" value={game.good.join(' ')} onChange={(v) => onChange({ ...game, good: v.split(/\s+/).filter(Boolean).slice(0, 6) })} />
        <Field label="Things to avoid (emoji, optional)" value={game.bad.join(' ')} onChange={(v) => onChange({ ...game, bad: v.split(/\s+/).filter(Boolean).slice(0, 6) })} />
        <Field label="How many to catch" value={String(game.target)} onChange={(v) => onChange({ ...game, target: Math.max(1, parseInt(v, 10) || 1) })} numeric />
        <Field label="Seconds allowed" value={String(game.seconds)} onChange={(v) => onChange({ ...game, seconds: Math.max(5, parseInt(v, 10) || 5) })} numeric />
        <Field
          label="Speed (1 is gentle, 2 is fast)"
          value={String(game.speed)}
          onChange={(v) => onChange({ ...game, speed: Math.max(0.5, Math.min(3, parseFloat(v) || 1)) })}
          numeric
        />
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
