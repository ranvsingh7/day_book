import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  return NextResponse.json({ user: auth.session });
}
