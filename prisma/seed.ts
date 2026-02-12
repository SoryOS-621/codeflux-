import { PrismaClient } from "../src/generated/client/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
});

export async function main() {
  console.log("Seed complete (no seed data defined).");
}

main();