import { NextResponse } from "next/server";

import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { UserModel } from "@/models/User";

export async function POST(request: Request) {
  await connectToDatabase();

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { identifier, password } = parsed.data;

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const isEmailLogin = normalizedIdentifier.includes("@");

  const user = await UserModel.findOne(
    isEmailLogin
      ? { email: normalizedIdentifier }
      : { mobile: identifier.trim() }
  );
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  let userRole = user.role === "admin" || user.role === "user" ? user.role : "user";

  const adminCount = await UserModel.countDocuments({ role: "admin" });
  if (adminCount === 0) {
    userRole = "admin";
    user.role = "admin";
    await user.save();
  }

  const token = await createSessionToken({
    userId: user._id.toString(),
    role: userRole,
    name: user.name || user.email || user.mobile,
    mobile: user.mobile || "",
    email: user.email || undefined,
  });

  await setSessionCookie(token);

  return NextResponse.json({
    user: {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email ?? null,
      role: userRole,
    },
  });
}
