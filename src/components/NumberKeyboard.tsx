import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TileState } from '../game/types';
import { colors } from '../theme';
interface Props { keyStates: Record<string, TileState>; onDigit: (digit: string) => void; onRemove: () => void; onSubmit: () => void; }
const ROWS = [['1', '2', '3', '4', '5'], ['6', '7', '8', '9', '0']];
export function NumberKeyboard({ keyStates, onDigit, onRemove, onSubmit }: Props) {
  return <View style={styles.keyboard} accessibilityLabel="Teclado numérico">
    {ROWS.map((row) => <View style={styles.row} key={row.join('')}>
      {row.map((digit) => <Pressable accessibilityRole="button" accessibilityLabel={`Número ${digit}`} onPress={() => onDigit(digit)} key={digit} style={({ pressed }) => [styles.key, keyStates[digit] && stateStyles[keyStates[digit]], pressed && styles.pressed]}><Text style={[styles.keyText, keyStates[digit] && styles.light]}>{digit}</Text></Pressable>)}
    </View>)}
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Apagar último número" onPress={onRemove} style={({ pressed }) => [styles.key, styles.remove, pressed && styles.pressed]}><Text style={styles.removeText}>⌫</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onSubmit} style={({ pressed }) => [styles.key, styles.submit, pressed && styles.pressed]}><Text style={styles.submitText}>CONFIRMAR</Text></Pressable>
    </View>
  </View>;
}
const stateStyles = StyleSheet.create({ correct: { backgroundColor: colors.green }, present: { backgroundColor: colors.yellow }, absent: { backgroundColor: colors.gray }, empty: {}, typing: {} });
const styles = StyleSheet.create({
  keyboard: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 7 }, row: { flexDirection: 'row', gap: 7 },
  key: { flex: 1, height: 49, borderRadius: 10, backgroundColor: colors.key, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  keyText: { color: colors.ink, fontSize: 20, fontWeight: '900' }, light: { color: colors.white }, remove: { flex: 0.9 }, removeText: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  submit: { flex: 4.1, backgroundColor: colors.accent }, submitText: { color: colors.white, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
});
