export const AVATARES_DISPONIVEIS = [
  "🦊",
  "🐱",
  "🐶",
  "🐼",
  "🐨",
  "🦁",
  "🐯",
  "🐰",
  "🐸",
  "🐙",
  "🦄",
  "🐵",
  "🐺",
  "🦉",
  "🐧",
  "🦋",
] as const;

export function avatarAleatorio(): string {
  return AVATARES_DISPONIVEIS[Math.floor(Math.random() * AVATARES_DISPONIVEIS.length)];
}
