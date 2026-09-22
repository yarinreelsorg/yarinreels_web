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
    // Cada combinação (largura × formato) de uma MESMA imagem conta como
    // uma transformação nova pra cota da Vercel — estourou o plano Hobby
    // (5.000/mês) com a lista padrão do Next (8 larguras de dispositivo +
    // 8 larguras de ícone, quase todas muito maiores que qualquer capa
    // daqui, ex: 1920/2048/3840). Reduz pro punhado de larguras que os
    // cards realmente usam (~75 a 420px) e tira o AVIF (WebP já é bem
    // menor que o JPEG original e sozinho já corta a metade das variantes
    // por imagem).
    deviceSizes: [384, 480, 640],
    imageSizes: [96, 160, 256],
    formats: ["image/webp"],
  },
};

export default nextConfig;
