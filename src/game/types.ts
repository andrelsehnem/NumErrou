export type GameModeId = 'daily' | 'easy' | 'hard' | 'custom';
export type GameStatus = 'playing' | 'won' | 'lost';
export type TileState = 'empty' | 'typing' | 'absent' | 'present' | 'correct';
export interface GameConfig { id: GameModeId; name: string; length: number; attempts: number | null; repeat: boolean; }
export interface GameState { answer: string; guesses: string[]; current: string; status: GameStatus; message: string; }
export interface CompletedRow { guess: string; result: TileState[]; }
