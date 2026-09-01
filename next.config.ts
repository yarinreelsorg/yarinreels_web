import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Padrão é 1MB — logos de app podem chegar a 2MB (ver TAMANHO_MAXIMO_LOGO).
      bodySizeLimit: "3mb",
    },
  },
  images: {
    // Pôsteres vêm do CDN do Blogger, que é pouco confiável sob carga
    // (derruba conexão quando várias capas pedem ao mesmo tempo — ver
    // PosterImg.tsx). Passar por next/image faz a Vercel buscar a imagem
    // UMA vez e depois servir do próprio cache dela pra todo mundo, em
    // vez de cada visitante depender diretamente do Blogger a cada
    // carregamento de página.
    remotePatterns: [{ protocol: "https", hostname: "*.googleusercontent.com" }],
    minimumCacheTTL: 2_592_000, // 30 dias — pôster de um título não muda sozinho
  },
};

export default nextConfig;
