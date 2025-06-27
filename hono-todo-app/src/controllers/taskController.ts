import { Context } from "hono";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "../db/config";
import { tasks, users } from "../db/schema";
import { z } from "zod";

// Handles all task-related logic for the API. See below for each function's details.

// Validation schemas for incoming task data. These help catch bad input early.
const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    status: z.enum(["pending", "in-progress", "completed"]).optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    status: z.enum(["pending", "in-progress", "completed"]).optional(),
});

const getTasksSchema = z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default("1"),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default("10"),
    status: z.enum(["pending", "in-progress", "completed"]).optional(),
    sortBy: z.enum(["dueDate", "createdAt", "title"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Create a new task for the authenticated user
export const createTask = async (c: Context) => {
    try {
        const userId = c.get("userId"); // userId is set by auth middleware
        const body = await c.req.json();

        // Validate input before touching the DB
        const validatedData = createTaskSchema.parse(body);

        // Insert the new task and return the created row
        const newTask = await db.insert(tasks).values({
            userId,
            title: validatedData.title,
            description: validatedData.description,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
            status: validatedData.status || "pending",
        }).returning();

        return c.json({
            success: true,
            data: newTask[0],
            message: "Task created successfully"
        }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Input didn't match schema
            return c.json({
                success: false,
                message: "Validation error",
                errors: error.errors
            }, 400);
        }

        // Log unexpected errors for debugging
        console.error("Create task error:", error);
        return c.json({
            success: false,
            message: "Internal server error"
        }, 500);
    }
};

// Fetch a paginated list of tasks for the user, with optional filters and sorting
export const getTasks = async (c: Context) => {
    try {
        const userId = c.get("userId");
        const query = c.req.query();

        // Validate and coerce query params
        const validatedQuery = getTasksSchema.parse(query);
        const { page, limit, status, sortBy, sortOrder } = validatedQuery;
        const offset = (page - 1) * limit;

        // Only show tasks belonging to the user
        const whereConditions = [eq(tasks.userId, userId)];
        if (status) {
            whereConditions.push(eq(tasks.status, status));
        }

        // Sorting logic
        let orderBy;
        if (sortBy === "dueDate") {
            orderBy = sortOrder === "asc" ? asc(tasks.dueDate) : desc(tasks.dueDate);
        } else if (sortBy === "title") {
            orderBy = sortOrder === "asc" ? asc(tasks.title) : desc(tasks.title);
        } else {
            // Default to createdAt
            orderBy = sortOrder === "asc" ? asc(tasks.createdAt) : desc(tasks.createdAt);
        }

        // Fetch tasks with pagination
        const userTasks = await db
            .select()
            .from(tasks)
            .where(and(...whereConditions))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        // Get total count for pagination UI
        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(tasks)
            .where(and(...whereConditions));

        const total = totalCount[0]?.count || 0;
        const totalPages = Math.ceil(total / limit);

        return c.json({
            success: true,
            data: {
                tasks: userTasks,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Query params didn't match schema
            return c.json({
                success: false,
                message: "Validation error",
                errors: error.errors
            }, 400);
        }

        console.error("Get tasks error:", error);
        return c.json({
            success: false,
            message: "Internal server error"
        }, 500);
    }
};

// Fetch a single task by ID, but only if it belongs to the user
export const getTaskById = async (c: Context) => {
    try {
        const userId = c.get("userId");
        const taskId = c.req.param("id");

        const task = await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
            .limit(1);

        if (!task.length) {
            // Don't leak info about other users' tasks
            return c.json({
                success: false,
                message: "Task not found"
            }, 404);
        }

        return c.json({
            success: true,
            data: task[0]
        });
    } catch (error) {
        console.error("Get task by ID error:", error);
        return c.json({
            success: false,
            message: "Internal server error"
        }, 500);
    }
};

// Update a task if it exists and belongs to the user
export const updateTask = async (c: Context) => {
    try {
        const userId = c.get("userId");
        const taskId = c.req.param("id");
        const body = await c.req.json();

        // Validate input
        const validatedData = updateTaskSchema.parse(body);

        // Check if task exists and belongs to user
        const existingTask = await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
            .limit(1);

        if (!existingTask.length) {
            // Don't allow updates to tasks you don't own
            return c.json({
                success: false,
                message: "Task not found"
            }, 404);
        }

        // Update only the provided fields
        const updatedTask = await db
            .update(tasks)
            .set({
                ...validatedData,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
            })
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
            .returning();

        return c.json({
            success: true,
            data: updatedTask[0],
            message: "Task updated successfully"
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Input didn't match schema
            return c.json({
                success: false,
                message: "Validation error",
                errors: error.errors
            }, 400);
        }

        console.error("Update task error:", error);
        return c.json({
            success: false,
            message: "Internal server error"
        }, 500);
    }
};

// Delete a task if it exists and belongs to the user
export const deleteTask = async (c: Context) => {
    try {
        const userId = c.get("userId");
        const taskId = c.req.param("id");

        // Check if the task exists and is owned by the user
        const existingTask =
            await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).limit(1);

        if (!existingTask.length) {
            // Don't allow deleting tasks you don't own
            return c.json({
                success: false,
                message: "Task not found"
            }, 404);
        }

        // Actually delete the task
        await db
            .delete(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

        return c.json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error("Delete task error:", error);
        return c.json({
            success: false,
            message: "Internal server error"
        }, 500);
    }
};
