import {
    pgTable,
    uuid,
    text,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["pending", "in-progress", "completed"]);

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date"),
    status: statusEnum("status").default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
});
