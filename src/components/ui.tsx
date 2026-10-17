import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  bg: '#1B1035',
  card: '#2A1B4F',
  text: '#F6F1FF',
  muted: '#B9A9DA',
  gold: '#F5B841',
  good: '#5CD38A',
  bad: '#FF6B6B',
};

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen}>
      {scroll ? <ScrollView contentContainerStyle={styles.pad}>{children}</ScrollView> : <View style={[styles.pad, { flex: 1 }]}>{children}</View>}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        kind === 'secondary' && styles.secondary,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonText, kind === 'secondary' && { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 20, gap: 14 },
  title: { color: colors.gold, fontSize: 28, fontWeight: '800' },
  body: { color: colors.text, fontSize: 17, lineHeight: 25 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 8 },
  button: { backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  secondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.muted },
  buttonText: { color: colors.bg, fontSize: 18, fontWeight: '700' },
});
