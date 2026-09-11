import { fileURLToPath } from "node:url";
import config from "./vite.config.js";

// Explicit, development-only QA configuration. Normal builds use vite.config.js.
export default {
  ...config,
  plugins: [{
    name: "isolated-ui-qa",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url === "/") request.url = "/qa/index.html";
        next();
      });
    },
    resolveId(source, importer) {
      if (source === "./supabase" && importer?.endsWith("/src/App.jsx")) {
        return fileURLToPath(new URL("./qa/mockSupabase.js", import.meta.url));
      }
    }
  }, ...config.plugins]
};
