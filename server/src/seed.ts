import { seedChronologicalUrapuntjaDemo } from './seed_urapuntja_chronological';

export async function seedDatabase() {
  console.log('Seeding SurePact Enterprise database with full multi-tenant Urapuntja dataset...');
  await seedChronologicalUrapuntjaDemo();
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
