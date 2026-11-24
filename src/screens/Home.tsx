import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Game } from '../game/types';
import { parseSharedCourse } from '../lib/share';
import { Run, saveCustomCourse, saveSpots } from '../lib/storage';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

export function Home({
  courses,
  run,
  onStart,
  onResume,
  onEdit,
  onNewCourse,
  onWizard,
  onImported,
  onLeaderboard,
  onSetup,
  onDemo,
}: {
  courses: Game[];
  run: Run | null;
  onStart: (game: Game) => void;
  onResume: () => void;
  onEdit: (game: Game) => void;
  onNewCourse: () => void;
  onWizard: () => void;
  onImported: (game: Game) => void;
  onLeaderboard: () => void;
  onSetup: () => void;
  onDemo: () => void;
}) {
  const [importing, setImporting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [location, setLocation] = useState<string | null>(null);

  // Courses grouped by where they're played. A course without a location
  // (like one made in the course maker) is its own location.
  const locations = new Map<string, Game[]>();
  for (const game of courses) {
    const key = game.location ?? game.title;
    locations.set(key, [...(locations.get(key) ?? []), game]);
  }

  if (picking && location && locations.has(location)) {
    return (
      <Screen>
        <Title>Pick a theme</Title>
        <Body style={{ color: colors.muted }}>{location}</Body>
        {locations.get(location)!.map((game) => (
          <Card key={game.id}>
            <Text style={{ color: game.starColor, fontSize: 22, fontWeight: '800' }}>{game.title}</Text>
            {(game.theme || game.badge) && (
              <Body style={{ color: colors.muted, fontSize: 14 }}>{[game.theme, game.badge].filter(Boolean).join(' · ')}</Body>
            )}
            <Body>{game.tagline}</Body>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Button title={run ? 'Start over' : 'Play'} onPress={() => onStart(game)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button kind="secondary" title={game.custom ? 'Edit' : 'Set up'} onPress={() => onEdit(game)} />
              </View>
            </View>
          </Card>
        ))}
        <Button kind="secondary" title="Back to locations" onPress={() => setLocation(null)} />
      </Screen>
    );
  }

  if (picking) {
    return (
      <Screen>
        <Title>Pick a location</Title>
        <Body style={{ color: colors.muted }}>Where are you playing?</Body>
        {[...locations.entries()].map(([name, games]) => (
          <Card key={name}>
            <Text style={{ color: games[0].starColor, fontSize: 22, fontWeight: '800' }}>📍 {name}</Text>
            <Body style={{ color: colors.muted, fontSize: 14 }}>
              {games.length === 1 ? '1 theme' : `${games.length} themes`}: {[...new Set(games.map((g) => g.theme ?? g.title))].join(', ')}
            </Body>
            <Button title="Choose" onPress={() => setLocation(name)} />
          </Card>
        ))}
        <Button kind="secondary" title="Back" onPress={() => setPicking(false)} />
      </Screen>
    );
  }

  const doImport = async () => {
    const shared = parseSharedCourse(pasted);
    if (!shared) return setImportError("That doesn't look like a Neocaching course. Paste the whole message you were sent.");
    await saveCustomCourse(shared.course);
    await saveSpots(shared.course.id, shared.spots);
    setImporting(false);
    setPasted('');
    setImportError(null);
    onImported(shared.course);
  };

  return (
    <Screen>
      <Title>Neocaching</Title>
      <Body style={{ color: colors.muted }}>
        Find the hidden tags, tap your phone on each one, and follow the clues to the finish.
      </Body>

      {run && <Button title="Continue your game" onPress={onResume} />}

      <Button title={run ? '▶ Start a new game' : '▶ Play'} onPress={() => setPicking(true)} />

      <Button title="✨ Course wizard (Claude writes it)" onPress={onWizard} />
      <Button kind="secondary" title="➕ Make a course myself" onPress={onNewCourse} />
      {importing ? (
        <Card>
          <Body>Paste the course message someone sent you:</Body>
          <TextInput
            value={pasted}
            onChangeText={setPasted}
            multiline
            placeholder="Paste here"
            placeholderTextColor={colors.muted}
            style={{ backgroundColor: colors.bg, color: colors.text, borderRadius: 10, padding: 10, minHeight: 90, textAlignVertical: 'top' }}
          />
          {importError && <Body style={{ color: colors.bad }}>{importError}</Body>}
          <Button title="Import" onPress={doImport} disabled={!pasted.trim()} />
          <Button kind="secondary" title="Cancel" onPress={() => setImporting(false)} />
        </Card>
      ) : (
        <Button kind="secondary" title="Import a course" onPress={() => setImporting(true)} />
      )}

      <Button kind="secondary" title="High scores" onPress={onLeaderboard} />
      <Button kind="secondary" title="Show me the star" onPress={onDemo} />
      <Button kind="secondary" title="Write tags and settings" onPress={onSetup} />
    </Screen>
  );
}
