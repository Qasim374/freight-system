import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get specific quote request by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the specific shipment/quote request
    const shipment = await db
      .select({
        id: shipments.id,
        status: shipments.status,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        numberOfContainers: shipments.numberOfContainers,
        preferredShipmentDate: shipments.preferredShipmentDate,
        createdAt: shipments.createdAt,
        quoteDeadline: shipments.quoteDeadline,
        quoteRequestedAt: shipments.quoteRequestedAt,
      })
      .from(shipments)
      .where(eq(shipments.id, params.id))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (shipment.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Get vendor quotes for this shipment
    const vendorQuotes = await db
      .select({
        id: quotes.id,
        cost: quotes.cost,
        carrierName: quotes.carrierName,
        sailingDate: quotes.sailingDate,
        isWinner: quotes.isWinner,
      })
      .from(quotes)
      .where(eq(quotes.shipmentId, params.id));

    const quoteData = {
      ...shipment[0],
      quotes: vendorQuotes,
    };

    return NextResponse.json(quoteData);
  } catch (error) {
    console.error("Get quote by ID API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 