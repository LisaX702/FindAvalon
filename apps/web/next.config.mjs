import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: path.resolve("../../"),
  experimental: {
    workerThreads: true
  }
};

export default nextConfig;
