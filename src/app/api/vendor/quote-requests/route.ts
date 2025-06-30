import { NextResponse } from "next/server";
import { eq, desc, asc, count, min } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, users, quoteBids } from "@/lib/schema";
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

    // Get quote requests (awaiting_bids status) with competition data
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

    // Get competition data for each request
    const requestsWithCompetition = await Promise.all(
      requests.map(async (request) => {
        // Get all bids for this quote
        const allBids = await db
          .select({
            id: quoteBids.id,
            vendorId: quoteBids.vendorId,
            costUsd: quoteBids.costUsd,
            status: quoteBids.status,
            createdAt: quoteBids.createdAt,
          })
          .from(quoteBids)
          .where(eq(quoteBids.quoteId, request.id))
          .orderBy(asc(quoteBids.costUsd));

        // Get vendor's own bid
        const myBid = allBids.find((bid) => bid.vendorId === vendorId);

        // Get lowest bid
        const lowestBid =
          allBids.length > 0 ? Number(allBids[0].costUsd) : null;

        // Calculate win percentage if vendor has a bid
        let winPercentage = null;
        if (myBid && lowestBid && Number(myBid.costUsd) > lowestBid) {
          winPercentage =
            ((Number(myBid.costUsd) - lowestBid) / lowestBid) * 100;
        }

        // Check if vendor's bid was the fastest
        const isFastest = myBid
          ? allBids.every((bid) => bid.createdAt >= myBid.createdAt)
          : false;

        return {
          id: request.id,
          containerType: request.containerType,
          commodity: request.commodity,
          origin: request.collectionAddress, // Using collectionAddress as origin
          destination: "N/A", // Not available in current schema
          status: request.status,
          createdAt: request.createdAt.toISOString(),
          clientId: request.clientId,
          clientName: request.clientName,
          myBid: myBid
            ? {
                cost: Number(myBid.costUsd),
                status: myBid.status,
                submittedAt: myBid.createdAt.toISOString(),
                isFastest: isFastest,
                winPercentage: winPercentage,
              }
            : undefined,
          totalBids: allBids.length,
          lowestBid: lowestBid,
        };
      })
    );

    return NextResponse.json({
      requests: requestsWithCompetition,
    });
  } catch (error) {
    console.error("Vendor quote requests API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
