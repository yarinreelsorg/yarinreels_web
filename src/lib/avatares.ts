export interface AvatarOpcao {
  id: string;
  nome: string;
  categoria: string;
  url: string;
}

export const CATEGORIAS_AVATAR = [
  "🎬 Séries & Atores",
  "🐉 Animes & Animações",
  "💖 Doramas & K-Dramas",
  "🦸‍♂️ Heróis & Vilões",
] as const;

export const AVATARES_DISPONIVEIS: AvatarOpcao[] = [
  // 🎬 Séries & Atores
  {
    id: "wandinha",
    nome: "Wandinha Addams",
    categoria: "🎬 Séries & Atores",
    url: "/avatares/wandinha.jpg",
  },
  {
    id: "peaky_blinders",
    nome: "Tommy Shelby",
    categoria: "🎬 Séries & Atores",
    url: "/avatares/peaky_blinders.jpg",
  },
  {
    id: "eleven",
    nome: "Eleven (Stranger Things)",
    categoria: "🎬 Séries & Atores",
    url: "/avatares/eleven.jpg",
  },
  {
    id: "heisenberg",
    nome: "Walter White (Breaking Bad)",
    categoria: "🎬 Séries & Atores",
    url: "/avatares/heisenberg.jpg",
  },
  {
    id: "geralt",
    nome: "Geralt (The Witcher)",
    categoria: "🎬 Séries & Atores",
    url: "/avatares/geralt.jpg",
  },
  {
    id: "squid_game",
    nome: "Guardião (Round 6)",
    categoria: "🎬 Séries & Atores",
    url: "/avatares/squid_game.jpg",
  },

  // 🐉 Animes & Animações
  {
    id: "anime_hero",
    nome: "Guerriro Anime",
    categoria: "🐉 Animes & Animações",
    url: "/avatares/anime_hero.jpg",
  },
  {
    id: "cyber_anime",
    nome: "Cyberpunk Anime",
    categoria: "🐉 Animes & Animações",
    url: "/avatares/cyber_anime.jpg",
  },
  {
    id: "saiyan",
    nome: "Super Saiyajin",
    categoria: "🐉 Animes & Animações",
    url: "/avatares/saiyan.jpg",
  },
  {
    id: "jinx",
    nome: "Jinx (Arcane)",
    categoria: "🐉 Animes & Animações",
    url: "/avatares/jinx.jpg",
  },
  {
    id: "anime_boy",
    nome: "Protagonista Anime",
    categoria: "🐉 Animes & Animações",
    url: "/avatares/anime_boy.jpg",
  },

  // 💖 Doramas & K-Dramas
  {
    id: "kdrama_star",
    nome: "Estrela K-Drama",
    categoria: "💖 Doramas & K-Dramas",
    url: "/avatares/kdrama_star.jpg",
  },
  {
    id: "kdrama_actor",
    nome: "Galã de Dorama",
    categoria: "💖 Doramas & K-Dramas",
    url: "/avatares/kdrama_actor.jpg",
  },

  // 🦸‍♂️ Heróis & Vilões
  {
    id: "batman",
    nome: "Cavaleiro das Trevas",
    categoria: "🦸‍♂️ Heróis & Vilões",
    url: "/avatares/batman.jpg",
  },
  {
    id: "joker",
    nome: "Coringa Neon",
    categoria: "🦸‍♂️ Heróis & Vilões",
    url: "/avatares/joker.jpg",
  },
  {
    id: "ironman",
    nome: "Homem de Ferro",
    categoria: "🦸‍♂️ Heróis & Vilões",
    url: "/avatares/ironman.jpg",
  },
];

export function avatarAleatorio(): string {
  const item = AVATARES_DISPONIVEIS[Math.floor(Math.random() * AVATARES_DISPONIVEIS.length)];
  return item.url;
}

/** ds_avatar guarda uma URL de imagem local (/avatares/...) ou externa (http/https) ou emoji legado. */
export function ehUrlAvatar(valor: string | null): boolean {
  if (!valor) return false;
  return (
    valor.startsWith("/") ||
    valor.startsWith("http://") ||
    valor.startsWith("https://")
  );
}
