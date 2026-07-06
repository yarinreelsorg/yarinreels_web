export const UNIVERSOS_CONFIG: Record<
  string,
  { label: string; imagemUrl: string; cor: string }
> = {
  dorama: {
    label: "Dorama",
    imagemUrl: "https://image.tmdb.org/t/p/w780/pGNS8UVMunGSifUEQJCONBQZW0P.jpg",
    cor: "#E91E8C",
  },
  "acao-e-aventura": {
    label: "Ação e Aventura",
    imagemUrl: "https://image.tmdb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    cor: "#F44336",
  },
  romance: {
    label: "Romance",
    imagemUrl: "https://image.tmdb.org/t/p/w780/aUPbIiL0aFYqUuiQ4UDkDCwBNTF.jpg",
    cor: "#E91E63",
  },
  terror: {
    label: "Terror",
    imagemUrl: "https://image.tmdb.org/t/p/w780/oW9NaEpGbfSuqZHCkBMuPdFMB2G.jpg",
    cor: "#9C27B0",
  },
  animacao: {
    label: "Animação",
    imagemUrl: "https://image.tmdb.org/t/p/w780/hpKTFDKlbr7OUJlxEr4rEulkZKq.jpg",
    cor: "#FF9800",
  },
  comedia: {
    label: "Comédia",
    imagemUrl: "https://image.tmdb.org/t/p/w780/nGsNruW3W27V6r4gkyMDBfC0v0o.jpg",
    cor: "#4CAF50",
  },
  "ficcao-cientifica": {
    label: "Ficção Científica",
    imagemUrl: "https://image.tmdb.org/t/p/w780/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
    cor: "#2196F3",
  },
  fantasia: {
    label: "Fantasia",
    imagemUrl: "https://image.tmdb.org/t/p/w780/pGNS8UVMunGSifUEQJCONBQZW0P.jpg",
    cor: "#673AB7",
  },
};

export function categoriaParaSlug(categoria: string): string {
  return categoria
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

export const COR_UNIVERSO_PADRAO = "#7B2FBE";
