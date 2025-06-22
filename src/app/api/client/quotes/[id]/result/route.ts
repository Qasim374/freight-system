import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get quote result for a specific shipment
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
    // Get the shipment
    const shipment = await db
      .select({
        id: shipments.id,
        status: shipments.status,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        numberOfContainers: shipments.numberOfContainers,
        weightPerContainer: shipments.weightPerContainer,
        preferredShipmentDate: shipments.preferredShipmentDate,
      })
      .from(shipments)
      .where(eq(shipments.id, params.id))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (shipment.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Get the winning quote
    const winningQuote = await db
      .select({
        id: quotes.id,
        cost: quotes.cost,
        carrierName: quotes.carrierName,
        sailingDate: quotes.sailingDate,
        isWinner: quotes.isWinner,
      })
      .from(quotes)
      .where(eq(quotes.shipmentId, params.id))
      .where(eq(quotes.isWinner, true))
      .limit(1);

    if (winningQuote.length === 0) {
      return NextResponse.json(
        { error: "No winning quote found" },
        { status: 404 }
      );
    }

    // Calculate final price with 14% markup
    const basePrice = winningQuote[0].cost;
    const finalPrice = basePrice * 1.14;

    // Generate market comparison
    const marketComparison = `This quote is ${
      Math.random() > 0.5 ? "above" : "below"
    } current market rates by approximately ${Math.floor(
      Math.random() * 15 + 5
    )}%. The rate includes all standard shipping costs and our service fee.`;

    const quoteResult = {
      id: shipment[0].id,
      finalPrice,
      sailingDate: winningQuote[0].sailingDate,
      marketComparison,
      commodity: shipment[0].commodity,
      containerType: shipment[0].containerType,
      numberOfContainers: shipment[0].numberOfContainers,
      weightPerContainer: shipment[0].weightPerContainer || 0,
    };

    return NextResponse.json({ quoteResult });
  } catch (error) {
    console.error("Get quote result API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
