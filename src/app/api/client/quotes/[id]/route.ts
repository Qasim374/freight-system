import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, quoteBids } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get individual quote details with bids
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const { id } = await params;

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get quote details
    const quote = await db
      .select({
        id: quotes.id,
        status: quotes.status,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        numContainers: quotes.numContainers,
        shipmentDate: quotes.shipmentDate,
        createdAt: quotes.createdAt,
        finalPrice: quotes.finalPrice,
        mode: quotes.mode,
        weightPerContainer: quotes.weightPerContainer,
        collectionAddress: quotes.collectionAddress,
      })
      .from(quotes)
      .where(eq(quotes.id, parseInt(id)))
      .where(eq(quotes.clientId, parseInt(userId)));

    if (!quote || quote.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Get bids for this quote
    const bids = await db
      .select({
        id: quoteBids.id,
        vendorId: quoteBids.vendorId,
        costUsd: quoteBids.costUsd,
        sailingDate: quoteBids.sailingDate,
        carrierName: quoteBids.carrierName,
        status: quoteBids.status,
        markupApplied: quoteBids.markupApplied,
        createdAt: quoteBids.createdAt,
      })
      .from(quoteBids)
      .where(eq(quoteBids.quoteId, parseInt(id)));

    return NextResponse.json({
      quote: quote[0],
      bids: bids.map((bid) => ({
        ...bid,
        createdAt: bid.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Quote details API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
