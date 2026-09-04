import { describe, expect, it } from 'vitest';
import { MODES, addDigit, blankGame, dailyAnswer, evaluateGuess, formatScoreLine, generateAnswer, submitGuess } from './engine';
describe('evaluateGuess', () => { it('marca posições corretas', () => expect(evaluateGuess('12345', '12345')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])); it('respeita repetidos', () => expect(evaluateGuess('11122', '12341')).toEqual(['correct', 'present', 'absent', 'present', 'absent'])); });
describe('answers', () => { it('gera sem repetição', () => expect(new Set(generateAnswer(10, false, () => 0.5)).size).toBe(10)); it('é estável', () => { const date = new Date('2026-08-31T15:00:00Z'); expect(dailyAnswer(5, date)).toBe(dailyAnswer(5, date)); }); });
describe('state', () => { it('rejeita incompleto', () => expect(submitGuess({ ...blankGame('12345'), current: '123' }, MODES.daily).message).toBe('Digite 5 números.')); it('impede repetição', () => expect(addDigit({ ...blankGame('1234'), current: '1' }, MODES.easy, '1').current).toBe('1')); it('vence', () => expect(submitGuess({ ...blankGame('12345'), current: '12345' }, MODES.daily).status).toBe('won')); it('perde', () => expect(submitGuess({ ...blankGame('12345'), guesses: Array(5).fill('00000'), current: '99999' }, MODES.daily).status).toBe('lost')); });
describe('attempt limits', () => {
  it('mantém o Fácil ativo até a nona tentativa incorreta', () => expect(submitGuess({ ...blankGame('1234'), guesses: Array(8).fill('0123'), current: '9876' }, MODES.easy).status).toBe('playing'));
  it('encerra o Fácil na décima tentativa incorreta', () => expect(submitGuess({ ...blankGame('1234'), guesses: Array(9).fill('0123'), current: '9876' }, MODES.easy).status).toBe('lost'));
  it('nunca encerra o Difícil por erros', () => expect(submitGuess({ ...blankGame('1234567890'), guesses: Array(99).fill('0000000000'), current: '9999999999' }, MODES.hard).status).toBe('playing'));
  it('formata a pontuação ilimitada com a contagem real', () => expect(formatScoreLine({ ...blankGame('1234567890'), guesses: Array(12).fill('0000000000'), status: 'won' }, MODES.hard)).toBe('12 tentativas'));
});
