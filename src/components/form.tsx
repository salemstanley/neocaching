import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Body, colors } from './ui';

// Form pieces shared by the course editor and the course wizard.
export const inputStyle = { backgroundColor: colors.bg, color: colors.text, fontSize: 16, borderRadius: 10, padding: 10 };

export function Field({
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

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
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

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
