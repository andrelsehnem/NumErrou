# NúmErrou - Descubra o número do dia!

Jogo diário de lógica feito com Expo, React Native e TypeScript. A mesma base de código roda em Android, iOS e web.

## Modos

- **Desafio do Dia:** 5 dígitos, 6 tentativas e a mesma resposta durante todo o dia.
- **Fácil:** 4 dígitos sem repetição e 10 tentativas.
- **Difícil:** 10 dígitos com repetição e tentativas ilimitadas.
- **Personalizado:** de 3 a 10 dígitos, de 4 a 12 tentativas e repetição configurável.

## Executar

```bash
npm install
npm start
```

Use `npm run android`, `npm run ios` ou `npm run web` para abrir uma plataforma. Valide o projeto com `npm test`, `npm run typecheck` e `npm run build:web`.

O progresso do desafio diário é salvo localmente em cada dispositivo. Um ranking competitivo exigirá geração e validação da resposta em um servidor.
