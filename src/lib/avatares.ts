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

/** ds_avatar guarda ou um emoji ou uma URL de foto colada pelo usuário. */
export function ehUrlAvatar(valor: string): boolean {
  return valor.startsWith("http://") || valor.startsWith("https://");
}
