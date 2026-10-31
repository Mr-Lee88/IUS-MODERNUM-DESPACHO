import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Cargas de PDF y de la plantilla de Excel desde formularios
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
