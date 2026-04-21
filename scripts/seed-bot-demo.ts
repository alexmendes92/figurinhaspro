// scripts/seed-bot-demo.ts
// Popula Seller "arena-demo" com catalogo de teste pro bot WhatsApp.
// Rodar: DATABASE_URL="<url>" npx tsx scripts/seed-bot-demo.ts
// Idempotente - safe pra rodar multiplas vezes.

import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_SLUG = "arena-demo";
const DEMO_EMAIL = "demo@arenacards.com.br";
const DEMO_PASSWORD = "demo-only-do-not-use";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL obrigatorio");

  const adapter = new PrismaNeon({ connectionString: url }, {});
  const db = new PrismaClient({ adapter });

  const hashedPwd = await bcrypt.hash(DEMO_PASSWORD, 10);

  const seller = await db.seller.upsert({
    where: { shopSlug: DEMO_SLUG },
    update: {
      shopName: "Arena Demo",
      plan: "PRO",
    },
    create: {
      name: "Arena Demo Bot",
      email: DEMO_EMAIL,
      password: hashedPwd,
      shopName: "Arena Demo",
      shopSlug: DEMO_SLUG,
      plan: "PRO",
    },
  });
  console.log(`seller ok: ${seller.id} (${seller.shopSlug})`);

  const priceRulesPlan: { stickerType: string; price: number }[] = [
    { stickerType: "regular", price: 3 },
    { stickerType: "foil", price: 10 },
    { stickerType: "shiny", price: 50 },
  ];

  for (const r of priceRulesPlan) {
    await db.priceRule.upsert({
      where: {
        sellerId_albumSlug_stickerType: {
          sellerId: seller.id,
          albumSlug: "",
          stickerType: r.stickerType,
        },
      },
      update: { price: r.price },
      create: {
        sellerId: seller.id,
        albumSlug: "",
        stickerType: r.stickerType,
        price: r.price,
      },
    });
  }
  console.log(`priceRules: ${priceRulesPlan.length}`);

  await db.sectionPriceRule.upsert({
    where: {
      sellerId_albumSlug_sectionName: {
        sellerId: seller.id,
        albumSlug: "panini_fifa_world_cup_2022",
        sectionName: "LEGENDS",
      },
    },
    update: { adjustType: "FLAT", value: 80 },
    create: {
      sellerId: seller.id,
      albumSlug: "panini_fifa_world_cup_2022",
      sectionName: "LEGENDS",
      adjustType: "FLAT",
      value: 80,
    },
  });
  console.log("sectionPriceRule LEGENDS 2022 ok");

  const inventory: {
    albumSlug: string;
    stickerCode: string;
    quantity: number;
    customPrice: number | null;
  }[] = [
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC1", quantity: 3, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC2", quantity: 2, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC4", quantity: 5, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC6", quantity: 1, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC8", quantity: 4, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC10", quantity: 2, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC12", quantity: 3, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC14", quantity: 5, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC15", quantity: 1, customPrice: 150 },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC17", quantity: 4, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC18", quantity: 2, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC19", quantity: 3, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC20", quantity: 2, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC21", quantity: 5, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2022", stickerCode: "FWC22", quantity: 4, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "1", quantity: 3, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "2", quantity: 2, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "3", quantity: 4, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "5", quantity: 1, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "10", quantity: 5, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "15", quantity: 2, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "20", quantity: 3, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "25", quantity: 2, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "30", quantity: 4, customPrice: null },
    { albumSlug: "panini_fifa_world_cup_2018", stickerCode: "35", quantity: 1, customPrice: null },
  ];

  for (const row of inventory) {
    await db.inventory.upsert({
      where: {
        sellerId_albumSlug_stickerCode: {
          sellerId: seller.id,
          albumSlug: row.albumSlug,
          stickerCode: row.stickerCode,
        },
      },
      update: { quantity: row.quantity, customPrice: row.customPrice },
      create: {
        sellerId: seller.id,
        albumSlug: row.albumSlug,
        stickerCode: row.stickerCode,
        quantity: row.quantity,
        customPrice: row.customPrice,
      },
    });
  }
  console.log(`inventory: ${inventory.length} linhas`);

  console.log("\nSeed completo. Seller:");
  console.log(`  id: ${seller.id}`);
  console.log(`  shopSlug: ${seller.shopSlug}`);
  console.log(`  plan: ${seller.plan}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
