
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const feedId = 'cmk2ztnux00000ajrn0u3uv0f';
    const feed = await prisma.feed.findUnique({
        where: { id: feedId },
    });
    console.log('Feed:', feed);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
