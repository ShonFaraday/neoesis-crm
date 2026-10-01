import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Next.js tome el package-lock.json de la carpeta de usuario como raíz.
  turbopack: { root: __dirname },
};

export default nextConfig;
