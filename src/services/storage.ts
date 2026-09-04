import AsyncStorage from '@react-native-async-storage/async-storage';
import { blankGame, dailyAnswer, dateKey } from '../game/engine';
import type { GameConfig, GameState, GameStatus } from '../game/types';
const keyForToday = () => `numero-do-dia:${dateKey()}`;
const isStatus = (value: unknown): value is GameStatus => value === 'playing' || value === 'won' || value === 'lost';
export function isValidGame(value: unknown, config: GameConfig, answer: string): value is GameState {
  if (!value || typeof value !== 'object') return false; const game = value as Partial<GameState>;
  return game.answer === answer && Array.isArray(game.guesses) && (config.attempts === null || game.guesses.length <= config.attempts) && game.guesses.every((guess) => typeof guess === 'string' && guess.length === config.length && /^\d+$/.test(guess)) && typeof game.current === 'string' && game.current.length <= config.length && /^\d*$/.test(game.current) && isStatus(game.status) && typeof game.message === 'string';
}
export async function loadDailyGame(config: GameConfig): Promise<GameState> {
  const answer = dailyAnswer(config.length);
  try { const raw = await AsyncStorage.getItem(keyForToday()); const saved: unknown = raw ? JSON.parse(raw) : null; if (isValidGame(saved, config, answer)) return saved; } catch { /* Inicia uma partida limpa. */ }
  return blankGame(answer);
}
export async function saveDailyGame(game: GameState): Promise<void> { await AsyncStorage.setItem(keyForToday(), JSON.stringify(game)); }
