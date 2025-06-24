import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get amendment details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const { id } = await params;
  const amendmentId = parseInt(id);

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(amendmentId)) {
    return NextResponse.json(
      { error: "Invalid amendment ID" },
      { status: 400 }
    );
  }

  try {
    const amendment = await db
      .select()
      .from(amendments)
      .where(eq(amendments.id, amendmentId))
      .limit(1);

    if (amendment.length === 0) {
      return NextResponse.json(
        { error: "Amendment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(amendment[0]);
  } catch (error) {
    console.error("Amendment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
