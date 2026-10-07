// Imports a DietPlan from a JSON file into a client's `plans`.
//
// Usage:
//   npx -y tsx scripts/import-plan.ts --file <plan.json> --client "<name or _id>"            # dry run
//   npx -y tsx scripts/import-plan.ts --file <plan.json> --client "<name or _id>" --apply    # write
//   ... --apply --replace   # replace the client's latest plan instead of appending
//
// The JSON is validated against the domain `DietPlanSchema` before anything
// is written. By default the plan is APPENDED, which makes it the active plan
// (the client views show the latest one) while keeping history. Every --apply
// first saves the client's current plans to backups/ (git-ignored).
import { config } from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

config({ path: '.env.local' });

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main() {
  const file = readArg('file');
  const clientRef = readArg('client');
  const apply = process.argv.includes('--apply');
  const replace = process.argv.includes('--replace');
  if (!file || !clientRef) fail('Usage: --file <plan.json> --client "<name or _id>" [--apply] [--replace]');

  const { DietPlanSchema } = await import('../src/domain/types/DietPlan');
  const parsed = DietPlanSchema.safeParse(JSON.parse(readFileSync(resolve(file), 'utf-8')));
  if (!parsed.success) fail(`Invalid plan JSON:\n${JSON.stringify(parsed.error.issues, null, 2)}`);
  const plan = parsed.data;

  const { default: mongoose } = await import('mongoose');
  const { default: dbConnect } = await import('../src/lib/db/mongodb');
  const { ClientModel } = await import('../src/lib/models/Client');
  await dbConnect();

  const query = mongoose.isValidObjectId(clientRef) ? { _id: clientRef } : { name: clientRef };
  const matches = await ClientModel.find(query);
  if (matches.length !== 1) fail(`Expected exactly 1 client for "${clientRef}", found ${matches.length}`);
  const client = matches[0];

  console.log(`Client: ${client.name} (${client._id}) — ${client.plans.length} plan(s) today`);
  console.log(
    `New plan: "${plan.label ?? '(sin nombre)'}" — ${plan.meals.length} meals, ` +
      `${plan.meals.reduce((n, m) => n + m.blocks.reduce((k, b) => k + b.options.length, 0), 0)} options, ` +
      `${plan.snacks?.length ?? 0} snacks, carbPool: ${plan.carbPool ? `${plan.carbPool.totalGrams} g ${plan.carbPool.referenceFood}` : 'none'}`,
  );
  console.log(`Mode: ${replace ? 'replace latest plan' : 'append (becomes the active plan)'}`);

  if (!apply) {
    console.log('\nDry run — nothing written. Re-run with --apply to save.');
    await mongoose.disconnect();
    return;
  }

  mkdirSync('backups', { recursive: true });
  const backupPath = `backups/plans-${client._id}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(backupPath, JSON.stringify(client.toObject().plans, null, 2));
  console.log(`Backup of current plans: ${backupPath}`);

  if (replace && client.plans.length > 0) {
    client.plans.splice(client.plans.length - 1, 1, plan);
  } else {
    client.plans.push(plan);
  }
  await client.save();
  console.log(`Saved. Client now has ${client.plans.length} plan(s).`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
