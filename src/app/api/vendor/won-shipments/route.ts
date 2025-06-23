import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, shipments, billsOfLading } from "@/lib/schema";
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

    // Get won shipments (quotes where vendor is winner)
    const wonShipments = await db
      .select({
        id: shipments.id,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        origin: shipments.origin,
        destination: shipments.destination,
        status: shipments.status,
        quoteId: quotes.id,
        cost: quotes.cost,
        sailingDate: quotes.sailingDate,
        carrierName: quotes.carrierName,
        draftBL: billsOfLading.draftBL,
        finalBL: billsOfLading.finalBL,
      })
      .from(quotes)
      .leftJoin(shipments, eq(quotes.shipmentId, shipments.id))
      .leftJoin(billsOfLading, eq(shipments.id, billsOfLading.shipmentId))
      .where(and(eq(quotes.vendorId, vendorId), eq(quotes.isWinner, true)));

    return NextResponse.json({
      shipments: wonShipments.map((shipment) => ({
        id: shipment.id,
        containerType: shipment.containerType,
        commodity: shipment.commodity,
        origin: shipment.origin,
        destination: shipment.destination,
        status: shipment.status,
        quoteId: shipment.quoteId,
        cost: shipment.cost,
        sailingDate: shipment.sailingDate.toISOString(),
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
