import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quoteBids } from "@/lib/schema";
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
    const { quoteRequestId, cost, sailingDate, carrierName } = body;

    if (!quoteRequestId || !cost || !sailingDate || !carrierName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vendorId = parseInt(userId);

    // Check if vendor already submitted a quote for this request
    const existingQuote = await db
      .select()
      .from(quoteBids)
      .where(
        and(
          eq(quoteBids.quoteId, quoteRequestId),
          eq(quoteBids.vendorId, vendorId)
        )
      );

    if (existingQuote.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted a quote for this request" },
        { status: 400 }
      );
    }

    // Insert the quote bid
    const newQuote = await db.insert(quoteBids).values({
      quoteId: quoteRequestId,
      vendorId,
      costUsd: cost.toString(),
      sailingDate: new Date(sailingDate),
      carrierName,
      status: "submitted",
      createdAt: new Date(),
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
