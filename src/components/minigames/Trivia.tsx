import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TriviaQuestion } from '../../game/types';
import { Body, Button, colors } from '../ui';

// Answer every question right to win.
export function Trivia({ questions, onDone }: { questions: TriviaQuestion[]; onDone: (won: boolean) => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [allRight, setAllRight] = useState(true);
  const q = questions[index];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i !== q.correctIndex) setAllRight(false);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      onDone(allRight);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Body style={{ color: colors.muted }}>
        Question {index + 1} of {questions.length}
      </Body>
      <Body style={{ fontSize: 20, fontWeight: '700' }}>{q.question}</Body>
      {q.answers.map((a, i) => {
        const showRight = picked !== null && i === q.correctIndex;
        const showWrong = picked === i && i !== q.correctIndex;
        return (
          <Pressable
            key={a}
            onPress={() => pick(i)}
            style={[styles.answer, showRight && { borderColor: colors.good }, showWrong && { borderColor: colors.bad }]}
          >
            <Text style={styles.answerText}>{a}</Text>
          </Pressable>
        );
      })}
      {picked !== null && <Button title={index + 1 < questions.length ? 'Next' : 'Finish'} onPress={next} />}
    </View>
  );
}

const styles = StyleSheet.create({
  answer: { borderWidth: 3, borderColor: colors.card, backgroundColor: colors.card, borderRadius: 14, padding: 16 },
  answerText: { color: colors.text, fontSize: 18 },
});
