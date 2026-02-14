import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Entry"
    ADD COLUMN IF NOT EXISTS "embedding" vector(768)
  `);

  console.log("DB init: pgvector extension and embedding column ready.");
}

main()
  .catch((e) => {
    console.error("DB init failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
