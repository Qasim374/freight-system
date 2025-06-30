import { NextResponse } from "next/server";
import { eq, and, asc, count } from "drizzle-orm";
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
        createdAt: quotes.createdAt,
      })
      .from(quotes)
      .where(eq(quotes.id, parseInt(params.id)))
      .where(eq(quotes.clientId, parseInt(userId)))
      .limit(1);

    if (quote.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Get all bids for this quote
    const allBids = await db
      .select({
        id: quoteBids.id,
        vendorId: quoteBids.vendorId,
        costUsd: quoteBids.costUsd,
        carrierName: quoteBids.carrierName,
        sailingDate: quoteBids.sailingDate,
        status: quoteBids.status,
        createdAt: quoteBids.createdAt,
      })
      .from(quoteBids)
      .where(eq(quoteBids.quoteId, parseInt(params.id)))
      .orderBy(asc(quoteBids.costUsd));

    if (allBids.length === 0) {
      return NextResponse.json(
        { error: "No bids found for this quote" },
        { status: 404 }
      );
    }

    // Check if 48 hours have passed or 3 quotes received
    const quoteCreatedAt = quote[0].createdAt;
    const now = new Date();
    const timeElapsed = now.getTime() - quoteCreatedAt.getTime();
    const hoursElapsed = timeElapsed / (1000 * 60 * 60);
    const hasEnoughQuotes = allBids.length >= 3;
    const isTimerExpired = hoursElapsed >= 48;

    // Auto-select lowest quote if conditions are met
    if (
      (isTimerExpired || hasEnoughQuotes) &&
      quote[0].status === "awaiting_bids"
    ) {
      const lowestBid = allBids[0]; // Already sorted by cost ascending

      // Calculate final price with 14% markup
      const basePrice = Number(lowestBid.costUsd);
      const markup = basePrice * 0.14;
      const finalPrice = basePrice + markup;

      // Update quote with selected vendor and final price
      await db
        .update(quotes)
        .set({
          status: "client_review",
          selectedVendorId: lowestBid.vendorId,
          finalPrice: finalPrice.toString(),
        })
        .where(eq(quotes.id, parseInt(params.id)));

      // Mark the selected bid
      await db
        .update(quoteBids)
        .set({ status: "selected" })
        .where(eq(quoteBids.id, lowestBid.id));

      // Mark other bids as rejected
      await db
        .update(quoteBids)
        .set({ status: "rejected" })
        .where(
          and(
            eq(quoteBids.quoteId, parseInt(params.id)),
            eq(quoteBids.id, lowestBid.id)
          )
        );
    }

    // Get the selected bid (either existing or newly selected)
    const selectedBid =
      allBids.find((bid) => bid.status === "selected") || allBids[0];

    // Calculate final price with markup if not already set
    const basePrice = Number(selectedBid.costUsd);
    const markup = basePrice * 0.14;
    const finalPrice = quote[0].finalPrice
      ? Number(quote[0].finalPrice)
      : basePrice + markup;

    // Generate market comparison data
    const marketComparison = generateMarketComparison(
      basePrice,
      quote[0].commodity,
      quote[0].containerType
    );

    // Calculate time remaining
    const deadline = new Date(quoteCreatedAt.getTime() + 48 * 60 * 60 * 1000);
    const timeRemaining = Math.max(
      0,
      Math.floor((deadline.getTime() - now.getTime()) / 1000)
    );

    return NextResponse.json({
      quoteResult: {
        id: quote[0].id,
        finalPrice: finalPrice,
        sailingDate: selectedBid.sailingDate?.toISOString() || "",
        marketComparison: marketComparison,
        commodity: quote[0].commodity,
        containerType: quote[0].containerType,
        numberOfContainers: quote[0].numContainers,
        weightPerContainer: Number(quote[0].weightPerContainer),
        quoteRequestedAt: quoteCreatedAt.toISOString(),
        vendorQuotesReceived: allBids.length,
        totalVendors: 5, // Assuming 5 total vendors in system
        timeRemaining: timeRemaining,
        canBook: isTimerExpired || hasEnoughQuotes,
        selectedVendorId: quote[0].selectedVendorId,
        carrierName: selectedBid.carrierName,
      },
    });
  } catch (error) {
    console.error("Quote result API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate market comparison
function generateMarketComparison(
  basePrice: number,
  commodity: string,
  containerType: string
): string {
  // This would typically integrate with external market data APIs
  // For now, we'll generate realistic mock data
  const marketRates = {
    Electronics: { "20ft": 2800, "40ft": 4200, "40HC": 4500 },
    Textiles: { "20ft": 2200, "40ft": 3300, "40HC": 3600 },
    Machinery: { "20ft": 3200, "40ft": 4800, "40HC": 5200 },
  };

  const defaultRates = { "20ft": 2500, "40ft": 3750, "40HC": 4000 };
  const marketRate =
    marketRates[commodity as keyof typeof marketRates]?.[
      containerType as keyof typeof defaultRates
    ] || defaultRates[containerType as keyof typeof defaultRates];

  const percentageDiff = ((marketRate - basePrice) / marketRate) * 100;

  if (percentageDiff > 10) {
    return `Royal Gulf's quote is ${Math.abs(percentageDiff).toFixed(
      1
    )}% above market rates. Consider negotiating.`;
  } else if (percentageDiff > 5) {
    return `Royal Gulf's quote is ${Math.abs(percentageDiff).toFixed(
      1
    )}% above market rates.`;
  } else if (percentageDiff > -5) {
    return `Royal Gulf's quote is in line with market rates.`;
  } else if (percentageDiff > -10) {
    return `Royal Gulf's quote is ${Math.abs(percentageDiff).toFixed(
      1
    )}% below market rates.`;
  } else {
    return `Royal Gulf's quote is ${Math.abs(percentageDiff).toFixed(
      1
    )}% below market rates. Excellent value!`;
  }
}
