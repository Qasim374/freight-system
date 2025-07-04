import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, billsOfLading, shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get pending amendments for client response
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get amendments that are in requested status for this client's shipments
    const pendingAmendments = await db
      .select({
        id: amendments.id,
        blId: amendments.blId,
        shipmentId: shipments.id,
        reason: amendments.reason,
        extraCost: amendments.extraCost,
        delayDays: amendments.delayDays,
        status: amendments.status,
        createdAt: amendments.createdAt,
      })
      .from(amendments)
      .innerJoin(billsOfLading, eq(amendments.blId, billsOfLading.id))
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .where(eq(amendments.status, "requested"))
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(amendments.createdAt);

    return NextResponse.json({
      amendments: pendingAmendments.map((amendment) => ({
        ...amendment,
        createdAt: amendment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Pending amendments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
