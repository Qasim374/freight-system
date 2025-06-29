import { NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, quoteBids, shipments, billsOfLading } from "@/lib/schema";
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

    // Get open quote requests (awaiting_bids status)
    const [openRequests] = await db
      .select({ count: count() })
      .from(quotes)
      .where(eq(quotes.status, "awaiting_bids"));

    // Get submitted quotes by this vendor
    const [submittedQuotes] = await db
      .select({ count: count() })
      .from(quoteBids)
      .where(eq(quoteBids.vendorId, vendorId));

    // Get jobs won by this vendor (shipments where vendor is assigned)
    const [jobsWon] = await db
      .select({ count: count() })
      .from(shipments)
      .where(eq(shipments.vendorId, vendorId));

    // Get BLs uploaded by this vendor
    const [blsUploaded] = await db
      .select({ count: count() })
      .from(billsOfLading)
      .where(eq(billsOfLading.vendorId, vendorId));

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
