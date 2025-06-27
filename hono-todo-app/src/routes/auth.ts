import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/config";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";

const authRouter = new Hono();

// Authentication routes for user registration and login

// Zod schema to validate registration and login input
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Route: Register a new user
// Handles duplicate email, password hashing, and inserts user into DB
authRouter.post("/register", async (c) => {
  const body = await c.req.json();

  // Validate input before proceeding
  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Invalid input", details: result.error.errors }, 400);
  }

  const { email, password } = result.data;

  // Check if user already exists (unique email constraint)
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return c.json({ error: "User already exists" }, 409);
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email,
    password: hashedPassword,
  });

  return c.json({ message: "User registered successfully" });
});

// Route: Login an existing user
// Checks credentials, verifies password, and returns JWT on success
authRouter.post("/login", async (c) => {
  const body = await c.req.json();

  // Validate input
  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Invalid input", details: result.error.errors }, 400);
  }

  const { email, password } = result.data;

  // Look up user by email
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length === 0) {
    // Don't reveal whether email exists for security
    return c.json({ error: "User not found" }, 404);
  }

  const user = existing[0];

  // Compare provided password with hashed password in DB
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return c.json({ error: "Incorrect password" }, 401);
  }

  // Generate JWT for authenticated user
  const token = generateToken({ userId: user.id, email: user.email });

  return c.json({ message: "Login successful", token });
});

// Export the router to be used in the main app
export default authRouter;
