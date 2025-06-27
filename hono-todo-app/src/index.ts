import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import "dotenv/config";

const app = new Hono();

// ✅ Middleware: logging + CORS
app.use("*", logger());
app.use("*", cors());

// ✅ Routes
app.route("/auth", authRoutes);
app.route("/tasks", taskRoutes);

// ✅ Root route
app.get("/", (c) => c.text("Task Management API is running"));

export default app;