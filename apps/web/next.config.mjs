import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@flowpilot/shared"],
  experimental: {
    // Trace files from monorepo root so standalone includes workspace deps.
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

export default nextConfig;
