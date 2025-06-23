import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get recent quote requests (shipments with quote_requested status)
    const recentRequests = await db
      .select({
        id: shipments.id,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        status: shipments.status,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.status, "quote_requested"))
      .orderBy(desc(shipments.createdAt))
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
