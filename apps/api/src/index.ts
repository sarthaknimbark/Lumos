import { buildApp } from "./app.js";
import { loadEnv } from "./config.js";

async function main() {
  const env = loadEnv();
  const app = await buildApp(env);

  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 MyDay API running at ${address}`);
    console.log(`🩺 Health check available at ${address}/health and ${address}/api/v1/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
