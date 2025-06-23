import { NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes, billsOfLading } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendorId = parseInt(userId);

    // Get open requests (shipments with quote_requested status)
    const [openRequests] = await db
      .select({ count: count() })
      .from(shipments)
      .where(eq(shipments.status, "quote_requested"));

    // Get submitted quotes by this vendor
    const [submittedQuotes] = await db
      .select({ count: count() })
      .from(quotes)
      .where(eq(quotes.vendorId, vendorId));

    // Get jobs won by this vendor
    const [jobsWon] = await db
      .select({ count: count() })
      .from(quotes)
      .where(and(eq(quotes.vendorId, vendorId), eq(quotes.isWinner, true)));

    // Get BLs uploaded by this vendor
    const [blsUploaded] = await db
      .select({ count: count() })
      .from(billsOfLading)
      .where(eq(billsOfLading.uploadedBy, vendorId));

    return NextResponse.json({
      openRequests: openRequests.count,
      submittedQuotes: submittedQuotes.count,
      jobsWon: jobsWon.count,
      blsUploaded: blsUploaded.count,
    });
  } catch (error) {
    console.error("Vendor dashboard stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
