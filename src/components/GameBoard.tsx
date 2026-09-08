import { useEffect, useRef } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { CompletedRow, GameConfig, GameState, TileState } from '../game/types';
import { colors } from '../theme';

interface Props { config: GameConfig; game: GameState; completedRows: CompletedRow[]; }
export function GameBoard({ config, game, completedRows }: Props) {
  const { width, height } = useWindowDimensions();
  const columnGap = config.length >= 8 ? 3 : 6;
  const unlimited = config.attempts === null;
  const visibleRows = config.attempts ?? 6;
  const rowCount = unlimited ? Math.max(6, completedRows.length + (game.status === 'playing' ? 1 : 0)) : visibleRows;
  const denseBoard = rowCount > 8;
  const rowGap = denseBoard ? 3 : 6;
  const isWeb = Platform.OS === 'web';
  const availableWidth = Math.min(width - 32, isWeb ? 640 : 560);
  const reservedHeight = (isWeb ? 360 : 390) + (denseBoard ? 34 : 0);
  const availableHeight = Math.max(160, height - reservedHeight);
  const maxTile = isWeb ? 74 : 58;
  const tile = Math.max(22, Math.min((availableWidth - columnGap * (config.length - 1)) / config.length, (availableHeight - rowGap * (visibleRows - 1)) / visibleRows, maxTile));
  const rows = Array.from({ length: rowCount }, (_, row) => {
    if (row < completedRows.length) return completedRows[row]!;
    if (row === completedRows.length && game.status === 'playing') return { guess: game.current.padEnd(config.length, ' '), result: Array<TileState>(config.length).fill('typing') };
    return { guess: ' '.repeat(config.length), result: Array<TileState>(config.length).fill('empty') };
  });
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { if (unlimited) scrollRef.current?.scrollToEnd({ animated: completedRows.length > 0 }); }, [completedRows.length, unlimited]);
  const board = <View style={[styles.board, { gap: rowGap }]} accessibilityLabel="Tabuleiro do jogo">
    {rows.map((row, rowIndex) => <View style={[styles.row, { gap: columnGap }]} key={rowIndex}>
      {[...row.guess].map((digit, columnIndex) => {
        const state = row.result[columnIndex] ?? 'empty';
        return <View key={columnIndex} style={[styles.tile, { width: tile, height: tile }, stateStyles[state]]}>
          <Text style={[styles.digit, isWeb && styles.webDigit, config.length >= 8 && styles.smallDigit, filledTextStates.includes(state) && styles.lightDigit]}>{digit.trim()}</Text>
        </View>;
      })}
    </View>)}
  </View>;
  if (!unlimited) return board;
  return <ScrollView ref={scrollRef} style={[styles.scroll, { maxHeight: availableHeight }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>{board}</ScrollView>;
}
const filledTextStates: TileState[] = ['correct', 'present', 'absent'];
const stateStyles = StyleSheet.create({
  empty: {}, typing: { borderColor: colors.muted, transform: [{ scale: 0.96 }] },
  correct: { backgroundColor: colors.green, borderColor: colors.green },
  present: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  absent: { backgroundColor: colors.gray, borderColor: colors.gray },
});
const styles = StyleSheet.create({
  board: { alignSelf: 'center', justifyContent: 'center' }, row: { flexDirection: 'row' },
  scroll: { width: '100%', alignSelf: 'center' }, scrollContent: { alignItems: 'center', paddingVertical: 2 },
  tile: { borderWidth: 1.5, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.paperLight, alignItems: 'center', justifyContent: 'center' },
  digit: { color: colors.ink, fontSize: 27, lineHeight: 31, fontWeight: '900', fontVariant: ['tabular-nums'] }, smallDigit: { fontSize: 19 }, lightDigit: { color: colors.white },
  webDigit: { fontSize: 35, lineHeight: 40 },
});
