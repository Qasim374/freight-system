import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, billsOfLading } from "@/lib/schema";

// This endpoint would be called by a scheduled job/cron to update tracking status
export async function POST(request: Request) {
  try {
    // Get all shipments that are in transit
    const inTransitShipments = await db
      .select({
        id: shipments.id,
        trackingStatus: shipments.trackingStatus,
        carrierReference: shipments.carrierReference,
        eta: shipments.eta,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.trackingStatus, "sailed"));

    const updatedShipments = [];

    for (const shipment of inTransitShipments) {
      if (!shipment.carrierReference) continue;

      // Simulate API call to carrier tracking system
      const trackingUpdate = await fetchCarrierTracking(
        shipment.carrierReference
      );

      if (trackingUpdate) {
        // Update shipment status based on carrier data
        await db
          .update(shipments)
          .set({
            trackingStatus: trackingUpdate.status,
            eta: trackingUpdate.eta
              ? new Date(trackingUpdate.eta)
              : shipment.eta,
          })
          .where(eq(shipments.id, shipment.id));

        // Log the tracking update
        await db.insert(shipmentLogs).values({
          shipmentId: shipment.id,
          actor: "system",
          action: "tracking_update",
          details: JSON.stringify(trackingUpdate),
        });

        updatedShipments.push({
          id: shipment.id,
          oldStatus: shipment.trackingStatus,
          newStatus: trackingUpdate.status,
          eta: trackingUpdate.eta,
        });
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedShipments.length} shipments`,
      updatedShipments,
    });
  } catch (error) {
    console.error("Automated tracking update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Simulate carrier API integration
async function fetchCarrierTracking(carrierReference: string) {
  // In a real implementation, this would call actual carrier APIs
  // For now, we'll simulate with mock data

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock tracking data based on carrier reference
  const mockTrackingData = {
    MAERSK: {
      status: Math.random() > 0.7 ? "delivered" : "sailed",
      eta: new Date(
        Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    MSC: {
      status: Math.random() > 0.8 ? "delivered" : "sailed",
      eta: new Date(
        Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    CMA: {
      status: Math.random() > 0.6 ? "delivered" : "sailed",
      eta: new Date(
        Date.now() + Math.random() * 8 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
  };

  // Extract carrier from reference (assuming format like "MAERSK123456")
  const carrier = Object.keys(mockTrackingData).find((c) =>
    carrierReference.toUpperCase().includes(c)
  );

  if (carrier) {
    return mockTrackingData[carrier as keyof typeof mockTrackingData];
  }

  // Default fallback
  return {
    status: "sailed",
    eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Import shipmentLogs schema
import { shipmentLogs } from "@/lib/schema";
