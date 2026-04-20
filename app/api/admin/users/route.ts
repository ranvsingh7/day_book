import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { createUserSchema } from "@/lib/validators";
import { UserModel } from "@/models/User";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000) {
    const keyPattern = (error as { keyPattern?: Record<string, unknown> }).keyPattern;
    if (keyPattern?.mobile) {
      return "Mobile already exists";
    }
    if (keyPattern?.email) {
      return "Email already exists";
    }
    return "Duplicate value already exists";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create user";
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const users = await UserModel.find({})
    .select("name mobile email role createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    await connectToDatabase();

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    const { name, mobile, email, password, role } = parsed.data;
    const normalizedMobile = mobile.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    const [existingMobile, existingEmail] = await Promise.all([
      UserModel.findOne({ mobile: normalizedMobile }),
      normalizedEmail ? UserModel.findOne({ email: normalizedEmail }) : Promise.resolve(null),
    ]);

    if (existingMobile) {
      return NextResponse.json({ error: "Mobile already exists" }, { status: 409 });
    }

    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const userId = new Types.ObjectId();

    await UserModel.collection.insertOne({
      _id: userId,
      name,
      mobile: normalizedMobile,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        user: {
          id: userId,
          name,
          mobile: normalizedMobile,
          email: normalizedEmail ?? null,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
