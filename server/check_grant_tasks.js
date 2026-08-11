const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const grant = await prisma.grant.findFirst({
    where: { title: { contains: 'Disaster Preparedness', mode: 'insensitive' } },
    include: {
      tasks: true,
      contracts: {
        include: {
          milestones: true,
          installments: true
        }
      }
    }
  });

  if (!grant) {
    console.log('Grant not found!');
    return;
  }

  console.log('FOUND GRANT:', grant.id, grant.title);
  console.log('TASKS COUNT:', grant.tasks.length);
  console.log('TASKS:', JSON.stringify(grant.tasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
