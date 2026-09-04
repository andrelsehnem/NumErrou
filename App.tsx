import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { GameBoard } from "./src/components/GameBoard";
import { GameModal, modalStyles } from "./src/components/GameModal";
import { NumberKeyboard } from "./src/components/NumberKeyboard";
import {
  DEFAULT_CUSTOM,
  MODES,
  addDigit,
  blankGame,
  dailyAnswer,
  evaluateGuess,
  formatScoreLine,
  generateAnswer,
  removeDigit,
  submitGuess,
} from "./src/game/engine";
import type {
  GameConfig,
  GameModeId,
  GameState,
  TileState,
} from "./src/game/types";
import { loadDailyGame, saveDailyGame } from "./src/services/storage";
import { colors } from "./src/theme";

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function App() {
  const { width } = useWindowDimensions();
  const compactLayout = width < 600;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerStartedAtRef = useRef<number | null>(null);
  const [mode, setMode] = useState<GameModeId>("daily");
  const [custom, setCustom] = useState<GameConfig>(DEFAULT_CUSTOM);
  const config = mode === "custom" ? custom : MODES[mode];
  const [game, setGame] = useState<GameState>(() =>
    blankGame(dailyAnswer(MODES.daily.length)),
  );
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false),
    [customOpen, setCustomOpen] = useState(false),
    [helpOpen, setHelpOpen] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;
  useEffect(() => {
    if (!timerRunning) return;
    const updateTimer = () => {
      if (timerStartedAtRef.current !== null)
        setElapsedSeconds(
          Math.floor((Date.now() - timerStartedAtRef.current) / 1000),
        );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 250);
    return () => clearInterval(interval);
  }, [timerRunning]);
  useEffect(() => {
    let active = true;
    loadDailyGame(MODES.daily).then((saved) => {
      if (active) {
        setGame(saved);
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (hydrated && mode === "daily")
      saveDailyGame(game).catch(() => undefined);
  }, [game, hydrated, mode]);
  const completedRows = useMemo(
    () =>
      game.guesses.map((guess) => ({
        guess,
        result: evaluateGuess(guess, game.answer),
      })),
    [game.guesses, game.answer],
  );
  const keyStates = useMemo(() => {
    const priority: Record<TileState, number> = {
        empty: 0,
        typing: 0,
        absent: 1,
        present: 2,
        correct: 3,
      },
      states: Record<string, TileState> = {};
    completedRows.forEach(({ guess, result }) =>
      result.forEach((state, index) => {
        const digit = guess[index]!;
        if (!states[digit] || priority[state] > priority[states[digit]!])
          states[digit] = state;
      }),
    );
    return states;
  }, [completedRows]);
  const onDigit = useCallback(
    (digit: string) =>
      setGame((old) => addDigit(old, configRef.current, digit)),
    [],
  );
  const onRemove = useCallback(() => setGame(removeDigit), []);
  const stopTimer = useCallback(() => {
    if (timerStartedAtRef.current !== null)
      setElapsedSeconds(
        Math.floor((Date.now() - timerStartedAtRef.current) / 1000),
      );
    setTimerRunning(false);
  }, []);
  const resetTimer = useCallback(() => {
    timerStartedAtRef.current = null;
    setElapsedSeconds(0);
    setTimerRunning(false);
  }, []);
  const onSubmit = useCallback(() => {
    const nextGame = submitGuess(game, configRef.current);
    const accepted = nextGame.guesses.length > game.guesses.length;
    if (accepted && game.guesses.length === 0) {
      timerStartedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setTimerRunning(nextGame.status === "playing");
    } else if (accepted && nextGame.status !== "playing") stopTimer();
    setGame(nextGame);
  }, [game, stopTimer]);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const handler = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) onDigit(event.key);
      else if (event.key === "Backspace") onRemove();
      else if (event.key === "Enter") onSubmit();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onDigit, onRemove, onSubmit]);
  function beginMode(nextMode: GameModeId, nextCustom = custom) {
    const nextConfig =
      nextMode === "custom"
        ? nextCustom
        : MODES[nextMode as keyof typeof MODES];
    setMode(nextMode);
    setMenuOpen(false);
    setCustomOpen(false);
    resetTimer();
    if (nextMode === "daily") {
      setHydrated(false);
      loadDailyGame(MODES.daily).then((saved) => {
        setGame(saved);
        setHydrated(true);
      });
    } else
      setGame(blankGame(generateAnswer(nextConfig.length, nextConfig.repeat)));
  }
  function adjustCustom(field: "length" | "attempts", delta: number) {
    const limits = field === "length" ? [3, 10] : [4, 12];
    setCustom((old) => ({
      ...old,
      [field]: Math.min(
        limits[1]!,
        Math.max(limits[0]!, (old[field] ?? limits[0]!) + delta),
      ),
    }));
  }
  async function shareResult() {
    const icons = {
      correct: "🟩",
      present: "🟨",
      absent: "⬛",
      empty: "",
      typing: "",
    };
    const squares = completedRows
      .map(({ result }) => result.map((state) => icons[state]).join(""))
      .join("\n");
    const text = `NúmErrou — ${config.name}\n${formatScoreLine(game, config)} · ${formatTimer(elapsedSeconds)}\n\n${squares}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined") {
        if (navigator.share) await navigator.share({ text });
        else {
          await navigator.clipboard.writeText(text);
          setGame((old) => ({ ...old, message: "Resultado copiado!" }));
        }
      } else await Share.share({ message: text });
    } catch {}
  }
  if (!hydrated)
    return (
      <SafeAreaView style={s.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={s.loadingText}>Preparando o desafio…</Text>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.app}>
        <View style={s.header}>
          <Icon
            label="Escolher modo"
            text="☰"
            onPress={() => setMenuOpen(true)}
          />
          <Pressable onPress={() => setMenuOpen(true)} style={s.titleWrap}>
            <Text
              style={[
                s.title,
                s.brandTitle,
                compactLayout && s.compactBrandTitle,
              ]}
            >
              NúmErrou
            </Text>
            <Text style={[s.title, compactLayout && s.compactTitle]}>Descubra o número do dia!</Text>
            <Text style={s.modeLabel}>{config.name} ▾</Text>
            <Text
              accessibilityLabel={`Tempo de jogo: ${formatTimer(elapsedSeconds)}`}
              style={[s.timer, timerRunning && s.timerRunning]}
            >
              ◷ {formatTimer(elapsedSeconds)}
            </Text>
          </Pressable>
          <Icon label="Como jogar" text="?" onPress={() => setHelpOpen(true)} />
        </View>
        <View style={s.rule} />
        <View style={s.gameArea}>
          <GameBoard
            config={config}
            game={game}
            completedRows={completedRows}
          />
          <Text
            style={[s.message, !!game.message && s.messageVisible]}
            accessibilityLiveRegion="polite"
          >
            {game.message || " "}
          </Text>
          {game.status === "playing" ? (
            <NumberKeyboard
              keyStates={keyStates}
              onDigit={onDigit}
              onRemove={onRemove}
              onSubmit={onSubmit}
            />
          ) : (
            <View style={s.endActions}>
              {mode !== "daily" && (
                <Primary
                  text="NOVA PARTIDA"
                  onPress={() => {
                    resetTimer();
                    setGame(
                      blankGame(generateAnswer(config.length, config.repeat)),
                    );
                  }}
                />
              )}
              <Pressable onPress={shareResult} style={s.secondary}>
                <Text style={s.secondaryText}>COMPARTILHAR RESULTADO</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <GameModal
        visible={menuOpen}
        title="Escolha o modo"
        onClose={() => setMenuOpen(false)}
      >
        <Option
          title="Desafio do Dia"
          caption="5 dígitos · 6 tentativas"
          onPress={() => beginMode("daily")}
        />
        <Option
          title="Fácil"
          caption="4 dígitos · 10 tentativas · sem repetição"
          onPress={() => beginMode("easy")}
        />
        <Option
          title="Difícil"
          caption="10 dígitos · tentativas ilimitadas"
          onPress={() => beginMode("hard")}
        />
        <Option
          title="Personalizado"
          caption="Você define as regras"
          onPress={() => {
            setMenuOpen(false);
            setCustomOpen(true);
          }}
        />
      </GameModal>
      <GameModal
        visible={customOpen}
        title="Partida personalizada"
        onClose={() => setCustomOpen(false)}
      >
        <Stepper
          label="Dígitos"
          value={custom.length}
          onMinus={() => adjustCustom("length", -1)}
          onPlus={() => adjustCustom("length", 1)}
        />
        <Stepper
          label="Tentativas"
          value={custom.attempts ?? 6}
          onMinus={() => adjustCustom("attempts", -1)}
          onPlus={() => adjustCustom("attempts", 1)}
        />
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Permitir números repetidos</Text>
          <Switch
            value={custom.repeat}
            onValueChange={(repeat) => setCustom((old) => ({ ...old, repeat }))}
            trackColor={{ false: colors.line, true: colors.green }}
          />
        </View>
        <Primary
          text="COMEÇAR PARTIDA"
          onPress={() => beginMode("custom", custom)}
        />
      </GameModal>
      <GameModal
        visible={helpOpen}
        title="Como jogar"
        onClose={() => setHelpOpen(false)}
      >
        <Text style={s.helpCopy}>
          Descubra o número secreto antes de acabarem suas tentativas.
        </Text>
        <Legend
          color={colors.green}
          symbol="7"
          text="Número correto na posição correta."
        />
        <Legend
          color={colors.yellow}
          symbol="4"
          text="Número presente em outra posição."
        />
        <Legend
          color={colors.gray}
          symbol="2"
          text="Número ausente da resposta."
        />
      </GameModal>
    </SafeAreaView>
  );
}
function Icon({
  label,
  text,
  onPress,
}: {
  label: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={s.iconButton}
    >
      <Text style={s.iconText}>{text}</Text>
    </Pressable>
  );
}
function Option({
  title,
  caption,
  onPress,
}: {
  title: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={modalStyles.option}>
      <Text style={modalStyles.optionTitle}>{title}</Text>
      <Text style={modalStyles.optionCaption}>{caption}</Text>
    </Pressable>
  );
}
function Primary({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={modalStyles.primary}>
      <Text style={modalStyles.primaryText}>{text}</Text>
    </Pressable>
  );
}
function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepper}>
        <Pressable
          accessibilityLabel={`Diminuir ${label}`}
          onPress={onMinus}
          style={s.stepButton}
        >
          <Text style={s.stepText}>−</Text>
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable
          accessibilityLabel={`Aumentar ${label}`}
          onPress={onPlus}
          style={s.stepButton}
        >
          <Text style={s.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
function Legend({
  color,
  symbol,
  text,
}: {
  color: string;
  symbol: string;
  text: string;
}) {
  return (
    <View style={s.legend}>
      <View style={[s.legendTile, { backgroundColor: color }]}>
        <Text style={s.legendSymbol}>{symbol}</Text>
      </View>
      <Text style={s.legendText}>{text}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  app: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: { color: colors.muted, fontWeight: "700" },
  header: {
    minHeight: 84,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  rule: { height: 1, backgroundColor: colors.line, marginHorizontal: 15 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  titleWrap: { flex: 1, alignItems: "center" },
  title: {
    color: colors.ink,
    fontSize: Platform.OS === "web" ? 30 : 22,
    lineHeight: Platform.OS === "web" ? 35 : 27,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  brandTitle: {
    color: colors.yellow,
    fontSize: Platform.OS === "web" ? 38 : 30,
    lineHeight: Platform.OS === "web" ? 43 : 35,
  },
  compactBrandTitle: {
    fontSize: 27,
    lineHeight: 31,
  },
  compactTitle: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  modeLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  timer: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  timerRunning: { color: colors.green },
  gameArea: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 760 : 620,
    alignSelf: "center",
    padding: 12,
    justifyContent: "space-between",
  },
  message: {
    minHeight: 24,
    marginVertical: 5,
    color: "transparent",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  messageVisible: { color: colors.ink },
  endActions: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 9 },
  secondary: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: colors.key,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.accent, fontSize: 13, fontWeight: "900" },
  switchRow: {
    minHeight: 58,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "700" },
  stepperRow: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperLabel: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.key,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.ink, fontSize: 23, fontWeight: "800" },
  stepValue: {
    width: 34,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  helpCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  legendTile: {
    width: 42,
    height: 42,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  legendSymbol: { color: colors.white, fontSize: 20, fontWeight: "900" },
  legendText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
