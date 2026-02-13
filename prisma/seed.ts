import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Technology", color: "#3B82F6", icon: "Cpu", description: "Tech-related ideas and notes" },
  { name: "Travel", color: "#10B981", icon: "Plane", description: "Trips, destinations, and travel plans" },
  { name: "Health", color: "#EF4444", icon: "Heart", description: "Health and wellness" },
  { name: "Finance", color: "#F59E0B", icon: "DollarSign", description: "Money, investments, budgets" },
  { name: "Creative", color: "#8B5CF6", icon: "Palette", description: "Art, writing, music, and creative projects" },
  { name: "Work", color: "#6366F1", icon: "Briefcase", description: "Professional and work-related" },
  { name: "Personal", color: "#EC4899", icon: "User", description: "Personal life and self-improvement" },
  { name: "Learning", color: "#06B6D4", icon: "BookOpen", description: "Education, courses, and learning" },
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
