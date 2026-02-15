import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { cookies } from "next/headers";

const GUEST_USER_ID = "guest-demo-user";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  const cookieStore = await cookies();
  if (cookieStore.get("guest_mode")?.value === "true") return GUEST_USER_ID;
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { entry: { select: { userId: true } } },
  });

  if (!attachment || attachment.entry.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(attachment.data, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`,
      "Content-Length": String(attachment.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { entry: { select: { userId: true } } },
  });

  if (!attachment || attachment.entry.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.attachment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
