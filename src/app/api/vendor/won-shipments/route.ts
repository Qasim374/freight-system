import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, billsOfLading, quotes, quoteBids } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendorId = parseInt(userId);

    // Get won shipments (shipments assigned to this vendor)
    const wonShipments = await db
      .select({
        id: shipments.id,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        collectionAddress: quotes.collectionAddress,
        status: shipments.shipmentStatus,
        cost: quoteBids.costUsd,
        sailingDate: quoteBids.sailingDate,
        carrierName: quoteBids.carrierName,
        draftBL: billsOfLading.draftBl,
        finalBL: billsOfLading.finalBl,
      })
      .from(shipments)
      .leftJoin(quotes, eq(shipments.quoteId, quotes.id))
      .leftJoin(quoteBids, eq(quotes.id, quoteBids.quoteId))
      .leftJoin(billsOfLading, eq(shipments.id, billsOfLading.shipmentId))
      .where(eq(shipments.vendorId, vendorId));

    return NextResponse.json({
      shipments: wonShipments.map((shipment) => ({
        id: shipment.id,
        containerType: shipment.containerType,
        commodity: shipment.commodity,
        origin: shipment.collectionAddress,
        destination: "N/A",
        status: shipment.status,
        cost: shipment.cost,
        sailingDate: shipment.sailingDate?.toISOString(),
        carrierName: shipment.carrierName,
        draftBL: shipment.draftBL,
        finalBL: shipment.finalBL,
      })),
    });
  } catch (error) {
    console.error("Vendor won shipments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
