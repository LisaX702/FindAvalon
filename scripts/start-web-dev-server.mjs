import { createServer } from "node:http";
import process from "node:process";
import next from "next";

const repoRoot = process.cwd();
const webDir = `${repoRoot}\\apps\\web`;
const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const appPort = Number(new URL(appUrl).port || "3000");
const hostname = "localhost";

async function main() {
  const app = next({
    dev: true,
    dir: webDir,
    hostname,
    port: appPort
  });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((request, response) => {
    handle(request, response).catch((error) => {
      console.error("Programmatic Next dev request failed.");
      console.error(error instanceof Error ? error.message : error);
      response.statusCode = 500;
      response.end("Internal server error.");
    });
  });

  server.listen(appPort, hostname, () => {
    console.log(`Programmatic Next dev server listening on http://${hostname}:${appPort}`);
  });
}

main().catch((error) => {
  console.error("Programmatic Next dev server failed to start.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
