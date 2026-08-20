import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the files the server actually needs, so
  // the production image doesn't have to carry node_modules around.
  output: "standalone",
  images: {
    localPatterns: [{ pathname: "/**" }],
  },
  experimental: {
    serverActions: {
      // Política é moldura de até 1MB (ver TEMPLATE_MAX_BYTES em
      // resize-template.ts), mas o arquivo vira base64 dentro do FormData
      // (~33% maior) + overhead do multipart — por isso o limite aqui
      // precisa ficar acima de 1MB, não igual.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
