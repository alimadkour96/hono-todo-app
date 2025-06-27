import { Context, Next } from "hono";
import { verifyToken } from "../utils/jwt";

interface JWTPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export const authMiddleware = async (c: Context, next: Next) => {
    try {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({
                success: false,
                message: "Authorization header missing or invalid"
            }, 401);
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        if (!token) {
            return c.json({
                success: false,
                message: "Token is required"
            }, 401);
        }

        console.log('Token received:', token);

        // Verify the token
        const decoded = verifyToken(token) as JWTPayload;

        if (!decoded || !decoded.userId) {
            return c.json({
                success: false,
                message: "Invalid or expired token"
            }, 401);
        }

        // Set user ID in context for use in controllers
        c.set("userId", decoded.userId);

        await next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return c.json({
            success: false,
            message: "Authentication failed"
        }, 401);
    }
};
