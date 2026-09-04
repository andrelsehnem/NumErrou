import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
interface Props { visible: boolean; title: string; onClose: () => void; children: ReactNode; }
export function GameModal({ visible, title, onClose, children }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Fechar janela">
      <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
        <View style={styles.heading}><Text style={styles.title}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
        {children}
      </Pressable>
    </Pressable>
  </Modal>;
}
export const modalStyles = StyleSheet.create({
  option: { padding: 15, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight },
  optionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, optionCaption: { color: colors.muted, fontSize: 13, marginTop: 4 },
  primary: { minHeight: 50, marginTop: 20, paddingHorizontal: 20, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: colors.white, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
const styles = StyleSheet.create({
  overlay: { flex: 1, padding: 18, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 460, maxHeight: '88%', padding: 22, borderRadius: 22, backgroundColor: colors.paper, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, title: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.key, alignItems: 'center', justifyContent: 'center' }, closeText: { color: colors.ink, fontSize: 27, lineHeight: 30 },
});
