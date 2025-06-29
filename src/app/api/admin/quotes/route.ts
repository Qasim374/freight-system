import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { quotes, quoteBids, users } from "@/lib/schema";

type QuoteStatus =
  | "awaiting_bids"
  | "bids_received"
  | "client_review"
  | "booked";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user.role.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "awaiting_bids";

    // Validate status parameter
    const validStatuses: QuoteStatus[] = [
      "awaiting_bids",
      "bids_received",
      "client_review",
      "booked",
    ];
    const status: QuoteStatus = validStatuses.includes(
      statusParam as QuoteStatus
    )
      ? (statusParam as QuoteStatus)
      : "awaiting_bids";

    // Fetch quotes with client information
    const quotesData = await db
      .select({
        id: quotes.id,
        clientId: quotes.clientId,
        mode: quotes.mode,
        containerType: quotes.containerType,
        numContainers: quotes.numContainers,
        commodity: quotes.commodity,
        weightPerContainer: quotes.weightPerContainer,
        shipmentDate: quotes.shipmentDate,
        collectionAddress: quotes.collectionAddress,
        status: quotes.status,
        finalPrice: quotes.finalPrice,
        selectedVendorId: quotes.selectedVendorId,
        createdAt: quotes.createdAt,
        clientEmail: users.email,
        clientCompany: users.company,
      })
      .from(quotes)
      .innerJoin(users, eq(quotes.clientId, users.id))
      .where(eq(quotes.status, status));

    // Transform the data to match the expected format
    const transformedQuotes = quotesData.map((quote) => ({
      id: quote.id,
      client: quote.clientCompany || quote.clientEmail,
      containerType: quote.containerType || "N/A",
      commodity: quote.commodity || "N/A",
      mode: quote.mode || "N/A",
      numContainers: quote.numContainers || 0,
      weightPerContainer: quote.weightPerContainer
        ? Number(quote.weightPerContainer)
        : 0,
      shipmentDate: quote.shipmentDate?.toISOString() || "N/A",
      collectionAddress: quote.collectionAddress || "N/A",
      status: quote.status,
      finalPrice: quote.finalPrice ? Number(quote.finalPrice) : 0,
      selectedVendorId: quote.selectedVendorId,
      createdAt: quote.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedQuotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user.role.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { quoteId, action, markup = 0.14 } = body;

    if (!quoteId || !action) {
      return NextResponse.json(
        { error: "Missing quoteId or action" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Get the quote details first
      const quoteData = await db
        .select({
          finalPrice: quotes.finalPrice,
        })
        .from(quotes)
        .where(eq(quotes.id, quoteId));

      if (quoteData.length === 0) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }

      const quote = quoteData[0];
      const clientPrice = Number(quote.finalPrice) * (1 + markup);

      // Update the quote to mark it as booked
      await db
        .update(quotes)
        .set({
          status: "booked",
          finalPrice: clientPrice,
        })
        .where(eq(quotes.id, quoteId));

      return NextResponse.json({
        success: true,
        clientPrice: clientPrice,
        markup: markup,
      });
    }

    if (action === "override") {
      // Get the quote details first
      const quoteData = await db
        .select({
          finalPrice: quotes.finalPrice,
        })
        .from(quotes)
        .where(eq(quotes.id, quoteId));

      if (quoteData.length === 0) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }

      const quote = quoteData[0];
      const clientPrice = Number(quote.finalPrice) * (1 + markup);

      // Update the quote to mark it as booked with custom markup
      await db
        .update(quotes)
        .set({
          status: "booked",
          finalPrice: clientPrice,
        })
        .where(eq(quotes.id, quoteId));

      return NextResponse.json({
        success: true,
        clientPrice: clientPrice,
        markup: markup,
      });
    }

    if (action === "reject") {
      // Update the quote to mark it as rejected
      await db
        .update(quotes)
        .set({ status: "awaiting_bids" })
        .where(eq(quotes.id, quoteId));

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}
