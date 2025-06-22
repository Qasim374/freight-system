import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Book a shipment
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
    // Verify the shipment exists and belongs to the client
    const shipmentData = await db
      .select({
        id: shipments.id,
        status: shipments.status,
      })
      .from(shipments)
      .where(eq(shipments.id, params.id))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (shipmentData.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    if (shipmentData[0].status !== "quote_confirmed") {
      return NextResponse.json(
        { error: "Shipment is not ready for booking" },
        { status: 400 }
      );
    }

    // Verify there's a winning quote
    const winningQuoteData = await db
      .select({
        id: quotes.id,
      })
      .from(quotes)
      .where(eq(quotes.shipmentId, params.id))
      .where(eq(quotes.isWinner, true))
      .limit(1);

    if (winningQuoteData.length === 0) {
      return NextResponse.json(
        { error: "No winning quote found" },
        { status: 400 }
      );
    }

    // Update shipment status to booked
    await db
      .update(shipments)
      .set({
        status: "booked",
      })
      .where(eq(shipments.id, params.id));

    return NextResponse.json({
      message: "Shipment booked successfully",
      shipmentId: params.id,
    });
  } catch (error) {
    console.error("Book shipment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
