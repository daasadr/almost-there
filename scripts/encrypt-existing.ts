/**
 * Jednorázový převod existujících dat do zašifrované podoby.
 *
 * Spouští se po nasazení šifrování:
 *   docker compose run --rm migrate npx tsx scripts/encrypt-existing.ts
 *
 * Je bezpečné ho pustit opakovaně — hodnoty, které už značku nesou, se
 * přeskočí. Bez tohohle by staré cíle zůstaly v databázi otevřeně ležet;
 * nové by se šifrovaly, staré ne, a nikdo by si toho nevšiml, protože
 * čtení funguje v obou případech stejně.
 *
 * Záměrně nejde přes běžného klienta aplikace: ten by při čtení hodnoty
 * rovnou rozšifroval a při zápisu zase zašifroval, takže by se nedalo
 * poznat, co už převedené je. Tady potřebujeme vidět syrový obsah.
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { encryptField, isEncrypted } from "../src/lib/crypto/field";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Chybí DATABASE_URL.");
if (!process.env.ENCRYPTION_KEY) throw new Error("Chybí ENCRYPTION_KEY.");

// Bez rozšíření — pracujeme se syrovými hodnotami.
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Zašifruje, co ještě značku nemá. */
function convert(value: string | null): string | null {
  if (value === null || isEncrypted(value)) return null;
  return encryptField(value);
}

async function main() {
  let changed = 0;

  const goals = await db.goal.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      restatement: true,
      assumptions: true,
      feasibilityNote: true,
      completionNote: true,
    },
  });

  for (const goal of goals) {
    const data: Record<string, unknown> = {};

    for (const field of [
      "title",
      "description",
      "restatement",
      "feasibilityNote",
      "completionNote",
    ] as const) {
      const next = convert(goal[field]);
      if (next !== null) data[field] = next;
    }

    // Seznam předpokladů se převádí po položkách; přeskočí se, jen když
    // je zašifrovaná už každá z nich.
    if (goal.assumptions.some((item) => !isEncrypted(item))) {
      data.assumptions = goal.assumptions.map((item) =>
        isEncrypted(item) ? item : encryptField(item),
      );
    }

    if (Object.keys(data).length > 0) {
      await db.goal.update({ where: { id: goal.id }, data });
      changed += 1;
    }
  }
  console.log(`cíle: převedeno ${changed} z ${goals.length}`);

  changed = 0;
  const blocks = await db.timeBlock.findMany({
    select: { id: true, title: true, summary: true },
  });
  for (const block of blocks) {
    const data: Record<string, unknown> = {};
    const title = convert(block.title);
    const summary = convert(block.summary);
    if (title !== null) data.title = title;
    if (summary !== null) data.summary = summary;

    if (Object.keys(data).length > 0) {
      await db.timeBlock.update({ where: { id: block.id }, data });
      changed += 1;
    }
  }
  console.log(`období: převedeno ${changed} z ${blocks.length}`);

  changed = 0;
  const tasks = await db.task.findMany({
    select: { id: true, title: true, description: true },
  });
  for (const task of tasks) {
    const data: Record<string, unknown> = {};
    const title = convert(task.title);
    const description = convert(task.description);
    if (title !== null) data.title = title;
    if (description !== null) data.description = description;

    if (Object.keys(data).length > 0) {
      await db.task.update({ where: { id: task.id }, data });
      changed += 1;
    }
  }
  console.log(`úkoly: převedeno ${changed} z ${tasks.length}`);

  changed = 0;
  const milestones = await db.milestone.findMany({
    select: { id: true, title: true, rewardText: true },
  });
  for (const milestone of milestones) {
    const data: Record<string, unknown> = {};
    const title = convert(milestone.title);
    const reward = convert(milestone.rewardText);
    if (title !== null) data.title = title;
    if (reward !== null) data.rewardText = reward;

    if (Object.keys(data).length > 0) {
      await db.milestone.update({ where: { id: milestone.id }, data });
      changed += 1;
    }
  }
  console.log(`milníky: převedeno ${changed} z ${milestones.length}`);

  changed = 0;
  const images = await db.goalImage.findMany({ select: { id: true, alt: true } });
  for (const image of images) {
    const alt = convert(image.alt);
    if (alt !== null) {
      await db.goalImage.update({ where: { id: image.id }, data: { alt } });
      changed += 1;
    }
  }
  console.log(`popisky obrázků: převedeno ${changed} z ${images.length}`);

  console.log("\nHotovo. Skript jde pustit znovu, nic se nepokazí.");
}

main()
  .catch((error) => {
    console.error("Převod selhal:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
