import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get amendment details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const amendmentId = parseInt(params.id);

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
    // Get amendment with shipment verification
    const amendmentData = await db
      .select({
        id: amendments.id,
        shipmentId: amendments.shipmentId,
        reason: amendments.reason,
        extraCost: amendments.extraCost,
        delayDays: amendments.delayDays,
        status: amendments.status,
        createdAt: amendments.createdAt,
      })
      .from(amendments)
      .innerJoin(shipments, eq(amendments.shipmentId, shipments.id))
      .where(eq(amendments.id, amendmentId))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (amendmentData.length === 0) {
      return NextResponse.json(
        { error: "Amendment not found" },
        { status: 404 }
      );
    }

    const amendment = amendmentData[0];

    return NextResponse.json({
      amendment: {
        ...amendment,
        extraCost: Number(amendment.extraCost),
        createdAt: amendment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Amendment details API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
