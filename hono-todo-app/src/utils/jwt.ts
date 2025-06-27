import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

console.log('DB_USER:', process.env.DB_USER);

export function generateToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}