import { cp, mkdir, stat, writeFile } from "node:fs/promises";

await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });

await writeFile(
  "dist/server/index.js",
  `export default {
  async fetch(request, env) {
    if (env?.ASSETS?.fetch) return env.ASSETS.fetch(request);
    return new Response("Site assets are unavailable.", { status: 503 });
  }
};
`
);

try {
  await stat(".openai/hosting.json");
  await cp(".openai/hosting.json", "dist/.openai/hosting.json");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
