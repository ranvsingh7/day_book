import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { error: apiError("Unauthorized", 401) };
  }

  return { session };
}

export async function requireAdmin() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth;
  }

  if (auth.session.role !== "admin") {
    return { error: apiError("Forbidden", 403) };
  }

  return auth;
}
