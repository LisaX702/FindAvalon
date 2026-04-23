import path from "node:path";

const useWindowsDevWorkerThreads =
  process.platform === "win32" && process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: path.resolve("../../"),
  ...(useWindowsDevWorkerThreads
    ? {
        experimental: {
          workerThreads: true
        }
      }
    : {})
};

export default nextConfig;
