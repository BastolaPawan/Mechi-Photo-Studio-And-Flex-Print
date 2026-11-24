import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prismaOffers: PrismaClient | undefined };

export const prisma = globalForPrisma.prismaOffers ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaOffers = prisma;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
