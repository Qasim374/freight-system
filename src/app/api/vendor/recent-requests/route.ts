import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get recent quote requests (awaiting_bids status)
    const recentRequests = await db
      .select({
        id: quotes.id,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        status: quotes.status,
        createdAt: quotes.createdAt,
      })
      .from(quotes)
      .where(eq(quotes.status, "awaiting_bids"))
      .orderBy(desc(quotes.createdAt))
      .limit(5);

    return NextResponse.json({
      requests: recentRequests.map((request) => ({
        id: request.id,
        containerType: request.containerType || "N/A",
        commodity: request.commodity || "N/A",
        status: request.status,
        createdAt: request.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Vendor recent requests API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
