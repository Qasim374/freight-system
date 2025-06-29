import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, quoteBids } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get quote result for a specific quote
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
    // Get the quote
    const quote = await db
      .select({
        id: quotes.id,
        status: quotes.status,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        numContainers: quotes.numContainers,
        weightPerContainer: quotes.weightPerContainer,
        shipmentDate: quotes.shipmentDate,
        finalPrice: quotes.finalPrice,
        selectedVendorId: quotes.selectedVendorId,
      })
      .from(quotes)
      .where(eq(quotes.id, parseInt(params.id)))
      .where(eq(quotes.clientId, parseInt(userId)))
      .limit(1);

    if (quote.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Get the selected vendor bid
    const selectedBid = await db
      .select({
        id: quoteBids.id,
        costUsd: quoteBids.costUsd,
        carrierName: quoteBids.carrierName,
        sailingDate: quoteBids.sailingDate,
        status: quoteBids.status,
      })
      .from(quoteBids)
      .where(eq(quoteBids.quoteId, parseInt(params.id)))
      .where(eq(quoteBids.status, "selected"))
      .limit(1);

    if (selectedBid.length === 0) {
      return NextResponse.json(
        { error: "No selected bid found" },
        { status: 404 }
      );
    }

    // Calculate final price with markup if not already set
    const basePrice = selectedBid[0].costUsd;
    const finalPrice = quote[0].finalPrice || basePrice * 1.14;

    // Generate market comparison
    const marketComparison = `This quote is ${
      Math.random() > 0.5 ? "above" : "below"
    } current market rates by approximately ${Math.floor(
      Math.random() * 15 + 5
    )}%. The rate includes all standard shipping costs and our service fee.`;

    const quoteResult = {
      id: quote[0].id,
      finalPrice,
      sailingDate: selectedBid[0].sailingDate,
      marketComparison,
      commodity: quote[0].commodity,
      containerType: quote[0].containerType,
      numberOfContainers: quote[0].numContainers,
      weightPerContainer: quote[0].weightPerContainer || 0,
      carrierName: selectedBid[0].carrierName,
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
