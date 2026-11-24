import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");
const seedPath = path.join(process.cwd(), "prisma", "offers.seed.json");
const records = JSON.parse(fs.readFileSync(seedPath, "utf8")) as Array<Record<string, unknown>>;

async function main() {
  for (const raw of records) {
    const { _note, ...record } = raw;
    const data = {
      number: record.number as number,
      slug: record.slug as string,
      name: record.name as string,
      category: record.category as string,
      icon: record.icon as string,
      targetCustomer: record.targetCustomer as string,
      price: record.price as number,
      originalPrice: (record.originalPrice as number | null) ?? null,
      cost: record.cost as number,
      included: record.included as string,
      bonus: (record.bonus as string) || "",
      scarcityText: (record.scarityText as string) || "",
      guarantee: (record.guarantee as string) || "",
      upsell: (record.upsell as string) || "",
      status: record.status as string,
      featured: Boolean(record.featured),
      badge: (record.badge as string | null) ?? null,
      seasonTags: (record.seasonTags as string[]) || [],
      slotsLimit: (record.slotsLimit as number | null) ?? null,
      startsAt: record.startsAt ? new Date(record.startsAt as string) : null,
      endsAt: record.endsAt ? new Date(record.endsAt as string) : null,
      sortOrder: record.sortOrder as number,
    };

    if (force) {
      await prisma.offer.upsert({ where: { number: data.number }, update: data, create: data });
    } else {
      const existing = await prisma.offer.findUnique({ where: { number: data.number } });
      if (!existing) await prisma.offer.create({ data });
    }
  }
  console.log(`Seeded ${records.length} offers${force ? " with --force" : " (existing offers preserved)"}.`);
}

main().finally(() => prisma.$disconnect());
