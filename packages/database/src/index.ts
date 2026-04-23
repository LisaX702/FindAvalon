import { PrismaClient } from "@prisma/client";

declare global {
  // Reuse the Prisma client during local hot reload.
  var __relocateitPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__relocateitPrisma__ ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__relocateitPrisma__ = prisma;
}
