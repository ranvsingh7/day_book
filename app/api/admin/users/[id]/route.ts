import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";
import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Mobile must be 10 to 15 digits"),
  email: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }
      const trimmed = value.trim().toLowerCase();
      return trimmed === "" ? undefined : trimmed;
    },
    z.email().optional()
  ),
  role: z.enum(["admin", "user"]),
  password: z
    .string()
    .min(6)
    .max(100)
    .optional()
    .or(z.literal("")),
});

function duplicateMessage(error: unknown) {
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

  return "Unable to update user";
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/users/[id]">
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const existing = await UserModel.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    const { name, mobile, email, role, password } = parsed.data;
    const normalizedMobile = mobile.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    const [mobileOwner, emailOwner] = await Promise.all([
      UserModel.findOne({ mobile: normalizedMobile }).select("_id").lean(),
      normalizedEmail
        ? UserModel.findOne({ email: normalizedEmail }).select("_id").lean()
        : Promise.resolve(null),
    ]);

    if (mobileOwner && String(mobileOwner._id) !== id) {
      return NextResponse.json({ error: "Mobile already exists" }, { status: 409 });
    }

    if (emailOwner && String(emailOwner._id) !== id) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    if (id === auth.session.userId && role !== "admin") {
      return NextResponse.json({ error: "You cannot remove your own admin access" }, { status: 400 });
    }

    const updateDoc: Record<string, unknown> = {
      name,
      mobile: normalizedMobile,
      role,
      updatedAt: new Date(),
    };

    if (normalizedEmail) {
      updateDoc.email = normalizedEmail;
    } else {
      updateDoc.email = null;
    }

    if (password && password.trim()) {
      updateDoc.password = await hashPassword(password);
    }

    await UserModel.collection.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: updateDoc,
      }
    );

    return NextResponse.json({
      user: {
        id,
        name,
        mobile: normalizedMobile,
        email: normalizedEmail ?? null,
        role,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: duplicateMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/users/[id]">
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  if (id === auth.session.userId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await connectToDatabase();

  const deleted = await UserModel.collection.deleteOne({ _id: new Types.ObjectId(id) });
  if (!deleted.deletedCount) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
