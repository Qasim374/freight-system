import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Book shipment with winning quote
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
    // Get shipment and verify ownership
    const shipmentData = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (shipmentData.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const shipment = shipmentData[0];

    // Check if shipment is in quote_confirmed status
    if (shipment.status !== "quote_confirmed") {
      return NextResponse.json(
        { error: "Shipment is not ready for booking" },
        { status: 400 }
      );
    }

    // Get the winning quote
    if (!shipment.winningQuoteId) {
      return NextResponse.json(
        { error: "No winning quote found" },
        { status: 400 }
      );
    }

    const quoteData = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, shipment.winningQuoteId))
      .limit(1);

    if (quoteData.length === 0) {
      return NextResponse.json(
        { error: "Winning quote not found" },
        { status: 404 }
      );
    }

    const winningQuote = quoteData[0];

    // Update shipment status to booking and set vendor
    await db
      .update(shipments)
      .set({
        status: "booking",
        vendorId: winningQuote.vendorId,
        sailingDate: winningQuote.sailingDate,
        carrierReference: `RG-${shipmentId.substring(0, 8).toUpperCase()}`,
      })
      .where(eq(shipments.id, shipmentId));

    // TODO: Notify vendor about the booking
    console.log(`Shipment ${shipmentId} booked with vendor ${winningQuote.vendorId}`);

    return NextResponse.json({
      shipmentId,
      message: "Shipment booked successfully",
      vendorId: winningQuote.vendorId,
      sailingDate: winningQuote.sailingDate,
    });
  } catch (error) {
    console.error("Book shipment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 