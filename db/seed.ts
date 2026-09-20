import { getDb } from "../api/queries/connection";
import { clubs } from "./schema";
import { CLUBS } from "./clubs-data";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");
  const existing = await db.select().from(clubs);
  if (existing.length > 0) {
    console.log(`Clubs table already has ${existing.length} rows, skipping.`);
    process.exit(0);
  }
  await db.insert(clubs).values(CLUBS);
  console.log(`Inserted ${CLUBS.length} clubs. Done.`);
  process.exit(0);
}

seed();
