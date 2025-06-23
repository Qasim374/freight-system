import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, users } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get quote requests (shipments with quote_requested status)
    const quoteRequests = await db
      .select({
        id: shipments.id,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        origin: shipments.origin,
        destination: shipments.destination,
        status: shipments.status,
        createdAt: shipments.createdAt,
        clientId: shipments.clientId,
        clientName: users.company,
      })
      .from(shipments)
      .leftJoin(users, eq(shipments.clientId, users.id))
      .where(eq(shipments.status, "quote_requested"))
      .orderBy(desc(shipments.createdAt));

    return NextResponse.json({
      requests: quoteRequests.map((request) => ({
        id: request.id,
        containerType: request.containerType,
        commodity: request.commodity,
        origin: request.origin,
        destination: request.destination,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        clientId: request.clientId,
        clientName: request.clientName,
      })),
    });
  } catch (error) {
    console.error("Vendor quote requests API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
