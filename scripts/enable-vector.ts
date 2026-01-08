import { prisma } from '@/lib/prisma';

async function main() {
    console.log('Enabling pgvector extension...');
    try {
        await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('✅ pgvector extension enabled.');
    } catch (e) {
        console.error('Failed to enable pgvector:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
