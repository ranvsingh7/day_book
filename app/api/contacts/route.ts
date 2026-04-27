import { NextResponse } from "next/server";
import { Types, type PipelineStage } from "mongoose";

import { requireAuth } from "@/lib/api";
import { contactCreateSchema } from "@/lib/validators";
import { connectToDatabase } from "@/lib/db";
import { ContactCategoryModel } from "@/models/ContactCategory";
import { ContactModel } from "@/models/Contact";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? "20");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 20;
  const skip = (page - 1) * limit;

  const userId = new Types.ObjectId(auth.session.userId);
  const regex = search ? new RegExp(search, "i") : null;

  const pipeline: PipelineStage[] = [
    { $match: { userId } } as PipelineStage.Match,
    {
      $lookup: {
        from: "contactcategories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    } as PipelineStage.Lookup,
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } } as PipelineStage.Unwind,
  ];

  if (regex) {
    pipeline.push({
      $match: {
        $or: [
          { name: regex },
          { mobile: regex },
          { "category.name": regex },
        ],
      },
    } as PipelineStage.Match);
  }

  pipeline.push({ $sort: { createdAt: -1 } } as PipelineStage.Sort);
  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: limit }],
      total: [{ $count: "count" }],
    },
  } as PipelineStage.Facet);

  const result = await ContactModel.aggregate(pipeline);
  const data = (result[0]?.data ?? []) as Array<
    Record<string, unknown> & { _id: Types.ObjectId; category?: { _id: Types.ObjectId; name: string } }
  >;
  const total = (result[0]?.total?.[0]?.count as number | undefined) ?? 0;

  const contacts = data.map((contact) => ({
    ...contact,
    _id: String(contact._id),
    categoryId: contact.category
      ? { _id: String(contact.category._id), name: contact.category.name }
      : contact.categoryId
        ? String(contact.categoryId)
        : "",
  }));

  return NextResponse.json({ contacts, total, hasMore: page * limit < total });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = contactCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact data" }, { status: 400 });
  }

  const userId = new Types.ObjectId(auth.session.userId);

  const category = await ContactCategoryModel.findOne({
    _id: parsed.data.categoryId,
    userId,
  });

  if (!category) {
    return NextResponse.json({ error: "Invalid contact category" }, { status: 400 });
  }

  const contact = await ContactModel.create({
    ...parsed.data,
    userId,
  });

  return NextResponse.json({ contact }, { status: 201 });
}
