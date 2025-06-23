import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, quotes } from "@/lib/schema";
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
    const { amendmentId, response, extraCost, delayDays, reason } = body;

    if (!amendmentId || !response || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vendorId = parseInt(userId);

    // Verify that this amendment is for a shipment where this vendor won the quote
    const amendment = await db
      .select()
      .from(amendments)
      .leftJoin(quotes, eq(amendments.shipmentId, quotes.shipmentId))
      .where(
        and(
          eq(amendments.id, amendmentId),
          eq(quotes.vendorId, vendorId),
          eq(quotes.isWinner, true)
        )
      );

    if (amendment.length === 0) {
      return NextResponse.json(
        { error: "Amendment not found or you are not authorized to respond" },
        { status: 404 }
      );
    }

    // Update the amendment with vendor response
    await db
      .update(amendments)
      .set({
        status: response === "approve" ? "approved" : "rejected",
        extraCost: response === "approve" ? extraCost?.toString() : null,
        delayDays: response === "approve" ? delayDays : null,
        reason,
        respondedAt: new Date(),
      })
      .where(eq(amendments.id, amendmentId));

    return NextResponse.json({
      message: `Amendment ${
        response === "approve" ? "approved" : "rejected"
      } successfully`,
    });
  } catch (error) {
    console.error("Vendor respond amendment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
