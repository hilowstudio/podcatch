import { PrismaClient } from '@/prisma/generated_new/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Singleton pattern for Prisma client in Next.js hot reload
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Prisma v7 with "prisma-client" generator requires adapter or accelerateUrl
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter } as any);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
