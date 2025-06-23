import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get all amendments for client
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let query = db
      .select({
        id: amendments.id,
        shipmentId: amendments.shipmentId,
        reason: amendments.reason,
        extraCost: amendments.extraCost,
        delayDays: amendments.delayDays,
        status: amendments.status,
        createdAt: amendments.createdAt,
        commodity: shipments.commodity,
        containerType: shipments.containerType,
      })
      .from(amendments)
      .innerJoin(shipments, eq(amendments.shipmentId, shipments.id))
      .where(eq(shipments.clientId, parseInt(userId)));

    // Apply status filter if provided
    if (statusFilter && statusFilter !== "all") {
      query = query.where(eq(amendments.status, statusFilter));
    }

    const amendmentsData = await query.orderBy(amendments.createdAt);

    return NextResponse.json({
      amendments: amendmentsData.map((amendment) => ({
        ...amendment,
        extraCost: Number(amendment.extraCost),
        createdAt: amendment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Client amendments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
