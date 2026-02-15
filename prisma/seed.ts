import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Trips", color: "#10B981", icon: "Plane", description: "Hotels, flights, tickets, and travel plans" },
  { name: "Entertainment", color: "#8B5CF6", icon: "Film", description: "Movies, shows, things to do, and activities" },
  { name: "To Read", color: "#3B82F6", icon: "BookOpen", description: "Articles, links, and things to try later" },
  { name: "Other", color: "#6B7280", icon: "MoreHorizontal", description: "Everything else" },
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
  }
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
