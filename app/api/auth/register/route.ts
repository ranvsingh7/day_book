import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    { error: "Signup is disabled. Contact admin to create your account." },
    { status: 403 }
  );
}
