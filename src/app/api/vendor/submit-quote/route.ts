import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function POST(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shipmentId, cost, sailingDate, carrierName } = body;

    if (!shipmentId || !cost || !sailingDate || !carrierName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vendorId = parseInt(userId);

    // Check if vendor already submitted a quote for this shipment
    const existingQuote = await db
      .select()
      .from(quotes)
      .where(
        eq(quotes.shipmentId, shipmentId) && eq(quotes.vendorId, vendorId)
      );

    if (existingQuote.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted a quote for this shipment" },
        { status: 400 }
      );
    }

    // Insert the quote
    const newQuote = await db.insert(quotes).values({
      shipmentId,
      vendorId,
      cost: cost.toString(),
      sailingDate: new Date(sailingDate),
      carrierName,
      status: "submitted",
      submittedAt: new Date(),
    });

    return NextResponse.json({
      message: "Quote submitted successfully",
      quoteId: newQuote.insertId,
    });
  } catch (error) {
    console.error("Vendor submit quote API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
