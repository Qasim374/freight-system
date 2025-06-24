import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, shipmentLogs, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get shipment history with logs
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all client shipments with quote details
    const clientShipments = await db
      .select({
        id: shipments.id,
        shipmentStatus: shipments.shipmentStatus,
        trackingStatus: shipments.trackingStatus,
        carrierReference: shipments.carrierReference,
        eta: shipments.eta,
        createdAt: shipments.createdAt,
        // Quote details
        commodity: quotes.commodity,
        containerType: quotes.containerType,
        mode: quotes.mode,
        collectionAddress: quotes.collectionAddress,
        shipmentDate: quotes.shipmentDate,
        finalPrice: quotes.finalPrice,
      })
      .from(shipments)
      .innerJoin(quotes, eq(shipments.quoteId, quotes.id))
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(shipments.createdAt));

    // Get logs for each shipment
    const shipmentsWithHistory = await Promise.all(
      clientShipments.map(async (shipment) => {
        const logs = await db
          .select({
            id: shipmentLogs.id,
            action: shipmentLogs.action,
            details: shipmentLogs.details,
            timestamp: shipmentLogs.timestamp,
            actor: shipmentLogs.actor,
          })
          .from(shipmentLogs)
          .where(eq(shipmentLogs.shipmentId, shipment.id))
          .orderBy(desc(shipmentLogs.timestamp));

        return {
          ...shipment,
          logs: logs.map((log) => ({
            ...log,
            timestamp: log.timestamp?.toISOString() || new Date().toISOString(),
          })),
        };
      })
    );

    return NextResponse.json({
      shipments: shipmentsWithHistory,
    });
  } catch (error) {
    console.error("Shipment history API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
