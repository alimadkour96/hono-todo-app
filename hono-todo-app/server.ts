import { JWT_SECRET } from "./src/config";
import app from "./src/index";
import { serve } from "@hono/node-server";

serve({ fetch: app.fetch, port: 3000 });

console.log("🚀 Server running at http://localhost:3000");
console.log("The secrettt isss",JWT_SECRET)
