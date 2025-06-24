import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - List client's shipments
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientShipments = await db
      .select({
        id: shipments.id,
        shipmentStatus: shipments.shipmentStatus,
        trackingStatus: shipments.trackingStatus,
        carrierReference: shipments.carrierReference,
        eta: shipments.eta,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(shipments.createdAt));

    return NextResponse.json({
      shipments: clientShipments.map((shipment) => ({
        ...shipment,
        createdAt: shipment.createdAt.toISOString(),
        eta: shipment.eta?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Client shipments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
