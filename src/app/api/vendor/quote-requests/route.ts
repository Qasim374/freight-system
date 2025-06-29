import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, users } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get quote requests (awaiting_bids status)
    const requests = await db
      .select({
        id: quotes.id,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        collectionAddress: quotes.collectionAddress,
        status: quotes.status,
        createdAt: quotes.createdAt,
        clientId: quotes.clientId,
        clientName: users.company,
      })
      .from(quotes)
      .leftJoin(users, eq(quotes.clientId, users.id))
      .where(eq(quotes.status, "awaiting_bids"))
      .orderBy(desc(quotes.createdAt));

    return NextResponse.json({
      requests: requests.map((request) => ({
        id: request.id,
        containerType: request.containerType,
        commodity: request.commodity,
        origin: request.collectionAddress, // Using collectionAddress as origin
        destination: "N/A", // Not available in current schema
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
