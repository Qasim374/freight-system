import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, billsOfLading } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get shipment tracking data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const { id: shipmentId } = await params;

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get shipment with tracking data
    const shipmentData = await db
      .select({
        id: shipments.id,
        shipmentStatus: shipments.shipmentStatus,
        trackingStatus: shipments.trackingStatus,
        carrierReference: shipments.carrierReference,
        eta: shipments.eta,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.id, parseInt(shipmentId)))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (shipmentData.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    const shipment = shipmentData[0];

    // Get Bill of Lading information
    const blData = await db
      .select({
        id: billsOfLading.id,
        draftBl: billsOfLading.draftBl,
        finalBl: billsOfLading.finalBl,
        blStatus: billsOfLading.blStatus,
        approvedByClient: billsOfLading.approvedByClient,
        createdAt: billsOfLading.createdAt,
      })
      .from(billsOfLading)
      .where(eq(billsOfLading.shipmentId, parseInt(shipmentId)));

    return NextResponse.json({
      shipment: {
        ...shipment,
        createdAt: shipment.createdAt.toISOString(),
        eta: shipment.eta?.toISOString() || null,
        billsOfLading: blData.map((bl) => ({
          ...bl,
          createdAt: bl.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Shipment tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
