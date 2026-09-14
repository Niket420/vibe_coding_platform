import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // web-tree-sitter's Emscripten-generated runtime guards `require("fs")`/
  // `require("path")` behind a `ENVIRONMENT_IS_NODE` runtime check (dead code
  // in a browser tab), but Turbopack still statically resolves those
  // requires when bundling for the client. Alias them to a no-op module.
  turbopack: {
    resolveAlias: {
      fs: { browser: "./stubs/empty-module.js" },
      path: { browser: "./stubs/empty-module.js" },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;