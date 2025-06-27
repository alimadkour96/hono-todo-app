import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from "../controllers/taskController";

const tasks = new Hono();

// Apply authentication middleware to all task routes
tasks.use("*", authMiddleware);

// Task CRUD routes
tasks.post("/", createTask);
tasks.get("/", getTasks);
tasks.get("/:id", getTaskById);
tasks.put("/:id", updateTask);
tasks.delete("/:id", deleteTask);

export default tasks;
