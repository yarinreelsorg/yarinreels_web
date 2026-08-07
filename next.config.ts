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
};

export default nextConfig;
