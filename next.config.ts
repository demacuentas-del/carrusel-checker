import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js"],
  // tesseract.js spawns its worker with a dynamically-built path
  // (path.join(__dirname, ...)), so Vercel's build-time file tracer
  // can't detect it and leaves the worker-script + wasm core out of
  // the deployed function, causing "Cannot find module '..'" at
  // runtime. Force those files to be included for the upload route.
  outputFileTracingIncludes: {
    "/api/reviews/*/slides": [
      "./node_modules/tesseract.js/src/worker-script/**/*",
      "./node_modules/tesseract.js-core/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
