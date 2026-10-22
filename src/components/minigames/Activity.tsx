import { View } from 'react-native';
import { Body, Button, Card } from '../ui';

// A real-world task, like eating dinner or taking a selfie. Done when you say so.
export function Activity({ task, onDone }: { task: string; onDone: (won: boolean) => void }) {
  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Body style={{ fontSize: 20, fontWeight: '700' }}>{task}</Body>
      </Card>
      <Button title="Done!" onPress={() => onDone(true)} />
    </View>
  );
}
