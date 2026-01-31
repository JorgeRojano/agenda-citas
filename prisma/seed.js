const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.service.createMany({
    data: [
      { name: "Corte", duration: 30, price: 150 },
      { name: "Corte + Barba", duration: 60, price: 250 }
    ]
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
