import { NextResponse } from "next/server";
import { eq, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, quoteBids } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - List client's quote requests
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientQuotes = await db
      .select({
        id: quotes.id,
        status: quotes.status,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        numContainers: quotes.numContainers,
        shipmentDate: quotes.shipmentDate,
        createdAt: quotes.createdAt,
        finalPrice: quotes.finalPrice,
        mode: quotes.mode,
        weightPerContainer: quotes.weightPerContainer,
        collectionAddress: quotes.collectionAddress,
      })
      .from(quotes)
      .where(eq(quotes.clientId, parseInt(userId)))
      .orderBy(desc(quotes.createdAt));

    // Get bid counts for each quote
    const quotesWithBidCounts = await Promise.all(
      clientQuotes.map(async (quote) => {
        const [bidCount] = await db
          .select({ count: count() })
          .from(quoteBids)
          .where(eq(quoteBids.quoteId, quote.id));

        return {
          ...quote,
          bidCount: bidCount.count,
        };
      })
    );

    return NextResponse.json({
      quotes: quotesWithBidCounts,
    });
  } catch (error) {
    console.error("Client quotes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new quote request
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      mode,
      containerType,
      numContainers,
      commodity,
      weightPerContainer,
      shipmentDate,
      collectionAddress,
    } = body;

    // Validate required fields
    if (
      !mode ||
      !containerType ||
      !numContainers ||
      !commodity ||
      !shipmentDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create quote request
    const [newQuote] = await db.insert(quotes).values({
      clientId: parseInt(userId),
      mode,
      containerType,
      numContainers,
      commodity,
      weightPerContainer: weightPerContainer
        ? parseFloat(weightPerContainer)
        : null,
      shipmentDate: new Date(shipmentDate),
      collectionAddress: mode === "Ex-Works" ? collectionAddress : null,
      status: "awaiting_bids",
    });

    // TODO: Route request to assigned vendors (this would be implemented in a separate service)
    console.log(
      `Quote request ${newQuote.insertId} created. Routing to vendors...`
    );

    return NextResponse.json({
      id: newQuote.insertId,
      message: "Quote request created successfully. Vendors will be notified.",
    });
  } catch (error) {
    console.error("Create quote API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
