import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, billsOfLading } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Approve Bill of Lading
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const shipmentId = params.id;

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify shipment belongs to client
    const shipmentData = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (shipmentData.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    const shipment = shipmentData[0];

    // Check if shipment is in draft_bl status
    if (shipment.status !== "draft_bl") {
      return NextResponse.json(
        { error: "Shipment is not in draft BL status" },
        { status: 400 }
      );
    }

    // Check if draft BL exists
    const draftBLData = await db
      .select()
      .from(billsOfLading)
      .where(eq(billsOfLading.shipmentId, shipmentId))
      .where(eq(billsOfLading.version, "draft"))
      .limit(1);

    if (draftBLData.length === 0) {
      return NextResponse.json(
        { error: "Draft Bill of Lading not found" },
        { status: 404 }
      );
    }

    // Approve the draft BL
    await db
      .update(billsOfLading)
      .set({ approved: true })
      .where(eq(billsOfLading.id, draftBLData[0].id));

    // Update shipment status to final_bl
    await db
      .update(shipments)
      .set({
        status: "final_bl",
        hasFinalBL: true,
      })
      .where(eq(shipments.id, shipmentId));

    return NextResponse.json({
      success: true,
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
