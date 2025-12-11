import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "./prisma";

// Re-export permissions for convenience
export { hasPermission, PERMISSIONS, type Role, type Permission } from "./permissions";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production-2024";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    
    if (!token) return null;
    
    const payload = verifyToken(token);
    if (!payload) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { team: true },
    });
    
    return user;
  } catch {
    return null;
  }
}

export function generateInvitationToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
