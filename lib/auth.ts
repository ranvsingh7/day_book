import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";

const SESSION_COOKIE = "daybook_session";
const secret = new TextEncoder().encode(env.JWT_SECRET);

export type SessionPayload = {
  userId: string;
  role: "admin" | "user";
  name: string;
  mobile: string;
  email?: string;
};

export type SessionData = {
  userId: string;
  role: "admin" | "user";
  name: string;
  mobile: string;
  email?: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId;

    if (typeof userId !== "string") {
      return null;
    }

    await connectToDatabase();
    const user = await UserModel.findById(userId).lean();

    if (!user) {
      return null;
    }

    const role = user.role === "admin" ? "admin" : "user";

    return {
      userId,
      role,
      name: user.name,
      mobile: user.mobile,
      email: user.email ?? undefined,
    };
  } catch {
    return null;
  }
}
