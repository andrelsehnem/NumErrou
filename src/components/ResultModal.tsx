import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { CompletedRow, GameConfig, GameState, TileState } from "../game/types";
import { colors } from "../theme";

interface Props {
  visible: boolean;
  game: GameState;
  config: GameConfig;
  completedRows: CompletedRow[];
  elapsed: string;
  score: string;
  onClose: () => void;
  onShare: () => void;
  onCopy: () => void;
  onChooseMode: (mode: "easy" | "hard" | "custom") => void;
}

const labels: Record<TileState, string> = {
  empty: "", typing: "", absent: "Ausente", present: "Presente", correct: "Correto",
};

export function ResultModal({ visible, game, config, completedRows, elapsed, score, onClose, onShare, onCopy, onChooseMode }: Props) {
  const [choosingMode, setChoosingMode] = useState(false);
  const won = game.status === "won";
  const close = () => {
    setChoosingMode(false);
    onClose();
  };
  const choose = (mode: "easy" | "hard" | "custom") => {
    setChoosingMode(false);
    onChooseMode(mode);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={close} accessibilityLabel="Fechar resultado">
        <Pressable style={styles.frame} onPress={(event) => event.stopPropagation()}>
          <View style={styles.card}>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={close} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <Text style={styles.kicker}>{won ? "DESAFIO CONCLUÍDO" : "FIM DE JOGO"}</Text>
            <Text style={styles.title}>{won ? "Você acertou!" : "Quase lá!"}</Text>
            <Text style={styles.summary}>{config.name} · {score} · {elapsed}</Text>
            {!won && <Text style={styles.answer}>O número era <Text style={styles.answerValue}>{game.answer}</Text></Text>}
            <View style={styles.divider} />
            <View style={styles.grid} accessibilityLabel="Resumo das tentativas">
              {completedRows.map(({ result, guess }, rowIndex) => (
                <View style={styles.row} key={`${guess}-${rowIndex}`}>
                  {result.map((state, columnIndex) => (
                    <View key={columnIndex} accessible accessibilityLabel={labels[state]} style={[styles.tile, tileStyles[state]]} />
                  ))}
                </View>
              ))}
            </View>
            {choosingMode ? (
              <View style={styles.choices}>
                <Text style={styles.choiceTitle}>Escolha a próxima partida</Text>
                <View style={styles.choiceRow}>
                  <Choice label="FÁCIL" onPress={() => choose("easy")} />
                  <Choice label="DIFÍCIL" onPress={() => choose("hard")} />
                </View>
                <Choice label="PERSONALIZADO" onPress={() => choose("custom")} wide />
              </View>
            ) : (
              <View style={styles.actions}>
                <View style={styles.actionRow}>
                  <Pressable accessibilityRole="button" onPress={onCopy} style={[styles.button, styles.copyButton]}>
                    <Text style={styles.copyText}>COPIAR</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={onShare} style={[styles.button, styles.shareButton]}>
                    <Text style={styles.shareText}>COMPARTILHAR</Text>
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" onPress={() => setChoosingMode(true)} style={[styles.button, styles.modeButton]}>
                  <Text style={styles.modeText}>ESCOLHER MODO</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Choice({ label, onPress, wide = false }: { label: string; onPress: () => void; wide?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.choice, wide && styles.choiceWide]}><Text style={[styles.choiceText, wide && styles.choiceWideText]}>{label}</Text></Pressable>;
}

const tileStyles = StyleSheet.create({
  empty: {}, typing: {}, absent: { backgroundColor: colors.gray }, present: { backgroundColor: colors.yellow }, correct: { backgroundColor: colors.green },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, padding: 18, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center" },
  frame: { width: "100%", maxWidth: 440, padding: 5, borderRadius: 23, backgroundColor: colors.accent, shadowColor: "#000", shadowOpacity: 0.32, shadowRadius: 26, shadowOffset: { width: 0, height: 13 }, elevation: 14 },
  card: { position: "relative", padding: 28, borderWidth: 2, borderColor: colors.paper, borderRadius: 18, backgroundColor: colors.paperLight, alignItems: "center" },
  close: { position: "absolute", right: 12, top: 12, width: 32, height: 32, borderRadius: 8, backgroundColor: colors.key, alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 28, fontWeight: "500" },
  kicker: { color: colors.green, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  title: { marginTop: 7, color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" },
  summary: { marginTop: 6, color: colors.muted, fontSize: 13, fontWeight: "800", textAlign: "center", fontVariant: ["tabular-nums"] },
  answer: { marginTop: 14, color: colors.muted, fontSize: 14, fontWeight: "700" },
  answerValue: { color: colors.ink, fontSize: 18, fontWeight: "900", fontVariant: ["tabular-nums"] },
  divider: { alignSelf: "stretch", height: 1, marginVertical: 19, backgroundColor: colors.line },
  grid: { maxWidth: "100%", alignItems: "center", gap: 6 },
  row: { flexDirection: "row", gap: 6 },
  tile: { width: 24, height: 24, borderWidth: 1.5, borderColor: colors.accent, borderRadius: 3 },
  actions: { width: "100%", gap: 9, marginTop: 21 }, actionRow: { flexDirection: "row", gap: 9 },
  button: { flex: 1, minHeight: 48, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  copyButton: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.paper }, copyText: { color: colors.accent, fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  shareButton: { backgroundColor: colors.accent }, shareText: { color: colors.white, fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  modeButton: { borderWidth: 1.5, borderColor: colors.green, backgroundColor: colors.paper }, modeText: { color: colors.green, fontSize: 11, fontWeight: "900", letterSpacing: 0.25 },
  choices: { width: "100%", marginTop: 4 }, choiceTitle: { marginBottom: 11, color: colors.muted, fontSize: 12, fontWeight: "800", textAlign: "center" },
  choiceRow: { flexDirection: "row", gap: 8 }, choice: { flex: 1, minHeight: 43, borderRadius: 8, backgroundColor: colors.key, alignItems: "center", justifyContent: "center" }, choiceWide: { marginTop: 8, backgroundColor: colors.accent },
  choiceText: { color: colors.ink, fontSize: 11, fontWeight: "900", letterSpacing: 0.35 }, choiceWideText: { color: colors.white },
});
