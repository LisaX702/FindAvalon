import { PrismaClient } from "@prisma/client";

const WEB_URL = process.env.WEB_URL ?? process.env.APP_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function checkApi() {
  const response = await fetch(`${API_URL}/api/health`);
  assert(response.ok, `API health endpoint failed with status ${response.status}`);
  const payload = await response.json();
  assert(payload.status === "ok", "API health payload did not report ok status.");
  return payload;
}

async function checkWeb() {
  const response = await fetch(`${WEB_URL}/sign-in`, {
    redirect: "manual"
  });
  assert(response.ok, `Web sign-in page failed with status ${response.status}`);
  const body = await response.text();
  assert(body.includes("Sign in"), "Web sign-in page did not render expected content.");
}

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    const locationCount = await prisma.location.count();
    const migrationCount = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int AS count FROM _prisma_migrations");
    return {
      locationCount,
      migrationCount: Number(migrationCount[0]?.count ?? 0)
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("Running readiness checks...");
  const api = await checkApi();
  console.log(`- API reachable: ${api.service}`);

  const database = await checkDatabase();
  console.log(`- DB reachable: ${database.locationCount} seeded locations`);
  console.log(`- Migration records present: ${database.migrationCount}`);

  await checkWeb();
  console.log("- Web reachable: sign-in page rendered");

  if (database.locationCount === 0) {
    console.log("- Seed status: no locations found; run npm.cmd run db:seed");
  } else {
    console.log("- Seed status: location dataset present");
  }

  console.log("Readiness check completed successfully.");
}

main().catch((error) => {
  console.error("Readiness check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
