import type { GameConfig, GameState, TileState } from './types';

export const MODES: Record<'daily' | 'easy' | 'hard', GameConfig> = {
  daily: { id: 'daily', name: 'Desafio do Dia', length: 5, attempts: 6, repeat: true },
  easy: { id: 'easy', name: 'Fácil', length: 4, attempts: 10, repeat: false },
  hard: { id: 'hard', name: 'Difícil', length: 10, attempts: null, repeat: true },
};
export const DEFAULT_CUSTOM: GameConfig = { id: 'custom', name: 'Personalizado', length: 5, attempts: 6, repeat: true };

export function dateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) { value ^= text.charCodeAt(index); value = Math.imul(value, 16777619); }
  return value >>> 0;
}
export function seededNumber(seed: number): () => number {
  let value = seed >>> 0;
  return () => { value += 0x6d2b79f5; let result = value; result = Math.imul(result ^ (result >>> 15), result | 1); result ^= result + Math.imul(result ^ (result >>> 7), result | 61); return ((result ^ (result >>> 14)) >>> 0) / 4294967296; };
}
export function generateAnswer(length: number, repeat: boolean, random = Math.random): string {
  if (repeat) return Array.from({ length }, () => Math.floor(random() * 10)).join('');
  const digits = Array.from({ length: 10 }, (_, index) => String(index));
  for (let index = digits.length - 1; index > 0; index -= 1) { const target = Math.floor(random() * (index + 1)); [digits[index], digits[target]] = [digits[target]!, digits[index]!]; }
  return digits.slice(0, length).join('');
}
export function dailyAnswer(length: number, date = new Date()): string { return generateAnswer(length, true, seededNumber(hash(`numero-do-dia:${dateKey(date)}`))); }
export function evaluateGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = Array(guess.length).fill('absent'); const remaining: Record<string, number> = {};
  for (let index = 0; index < answer.length; index += 1) { if (guess[index] === answer[index]) result[index] = 'correct'; else { const digit = answer[index]!; remaining[digit] = (remaining[digit] ?? 0) + 1; } }
  for (let index = 0; index < guess.length; index += 1) { if (result[index] === 'correct') continue; const digit = guess[index]!; if ((remaining[digit] ?? 0) > 0) { result[index] = 'present'; remaining[digit] = remaining[digit]! - 1; } }
  return result;
}
export function blankGame(answer: string): GameState { return { answer, guesses: [], current: '', status: 'playing', message: '' }; }
export function addDigit(game: GameState, config: GameConfig, digit: string): GameState {
  if (game.status !== 'playing' || game.current.length >= config.length) return game;
  if (!config.repeat && game.current.includes(digit)) return { ...game, message: 'Neste modo os números não se repetem.' };
  return { ...game, current: game.current + digit, message: '' };
}
export function removeDigit(game: GameState): GameState { return game.status === 'playing' ? { ...game, current: game.current.slice(0, -1), message: '' } : game; }
export function submitGuess(game: GameState, config: GameConfig): GameState {
  if (game.status !== 'playing') return game;
  if (game.current.length !== config.length) return { ...game, message: `Digite ${config.length} números.` };
  const guesses = [...game.guesses, game.current];
  if (game.current === game.answer) return { ...game, guesses, current: '', status: 'won', message: 'Você acertou! 🎉' };
  if (config.attempts !== null && guesses.length >= config.attempts) return { ...game, guesses, current: '', status: 'lost', message: `O número era ${game.answer}.` };
  return { ...game, guesses, current: '', message: '' };
}

export function formatScoreLine(game: GameState, config: GameConfig): string {
  if (config.attempts === null) return `${game.guesses.length} ${game.guesses.length === 1 ? 'tentativa' : 'tentativas'}`;
  return `${game.status === 'won' ? game.guesses.length : 'X'}/${config.attempts}`;
}
