import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { billsOfLading, shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Approve Bill of Lading
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const { id } = await params;
  const shipmentId = parseInt(id);

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify the shipment belongs to the client
    const clientShipment = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (clientShipment.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update BL approval status
    await db
      .update(billsOfLading)
      .set({
        approvedByClient: true,
        blStatus: "final_approved",
      })
      .where(eq(billsOfLading.shipmentId, shipmentId));

    // Update shipment status
    await db
      .update(shipments)
      .set({
        shipmentStatus: "final_bl_uploaded",
        trackingStatus: "loading",
      })
      .where(eq(shipments.id, shipmentId));

    return NextResponse.json({
      message: "Bill of Lading approved successfully",
    });
  } catch (error) {
    console.error("Approve BL API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
