import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `output: "export"` was removed deliberately. The platform now needs a
  // server runtime for route handlers, middleware-based RBAC, the payment
  // webhook/reconciliation endpoints and session cookies — none of which can
  // exist in a static export. The public marketing pages still render
  // identically; they are simply statically optimised by Next at build time
  // instead of being emitted as a standalone `out/` folder.
  output: "standalone",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@node-rs/argon2", "pino", "exceljs"],
};

export default nextConfig;
