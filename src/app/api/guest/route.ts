import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("guest_mode", "true", {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: "lax",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("guest_mode");
  return response;
}
