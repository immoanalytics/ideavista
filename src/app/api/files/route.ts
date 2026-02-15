import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { cookies } from "next/headers";

const GUEST_USER_ID = "guest-demo-user";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

async function getUserId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  const cookieStore = await cookies();
  if (cookieStore.get("guest_mode")?.value === "true") return GUEST_USER_ID;
  return null;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const entryId = formData.get("entryId") as string | null;
  const file = formData.get("file") as File | null;

  if (!entryId || !file) {
    return NextResponse.json(
      { error: "entryId and file are required" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed: ${file.type}` },
      { status: 400 }
    );
  }

  // Verify entry belongs to user
  const entry = await db.entry.findFirst({
    where: { id: entryId, userId },
  });
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const attachment = await db.attachment.create({
    data: {
      entryId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      data: buffer,
    },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });

  return NextResponse.json(attachment);
}
