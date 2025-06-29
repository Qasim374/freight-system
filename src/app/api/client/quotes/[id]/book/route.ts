import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Book a quote
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify there's a winning quote
    const winningQuoteData = await db
      .select({
        id: quotes.id,
      })
      .from(quotes)
      .where(eq(quotes.id, parseInt(params.id)))
      .where(eq(quotes.status, "client_review"))
      .limit(1);

    if (winningQuoteData.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Update quote status to booked
    await db
      .update(quotes)
      .set({
        status: "booked",
      })
      .where(eq(quotes.id, parseInt(params.id)));

    // Create a new shipment record
    const [newShipment] = await db
      .insert(shipments)
      .values({
        quoteId: parseInt(params.id),
        clientId: parseInt(userId),
        vendorId: winningQuoteData[0].selectedVendorId,
        shipmentStatus: "booked",
        trackingStatus: "quote_confirmed",
      })
      .returning();

    return NextResponse.json({
      message: "Quote booked successfully",
      quoteId: params.id,
      shipmentId: newShipment.id,
    });
  } catch (error) {
    console.error("Book quote API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
