import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq } from "drizzle-orm";
import { quotes, shipments, users } from "@/lib/schema";

type ShipmentStatus =
  | "quote_requested"
  | "quote_received"
  | "booked"
  | "draft_bl"
  | "final_bl"
  | "in_transit"
  | "delivered";

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
    const statusParam = searchParams.get("status") || "quote_requested";

    // Validate status parameter
    const validStatuses: ShipmentStatus[] = [
      "quote_requested",
      "quote_received",
      "booked",
      "draft_bl",
      "final_bl",
      "in_transit",
      "delivered",
    ];
    const status: ShipmentStatus = validStatuses.includes(
      statusParam as ShipmentStatus
    )
      ? (statusParam as ShipmentStatus)
      : "quote_requested";

    // Fetch quotes with shipment and client information
    const quotesData = await db
      .select({
        id: quotes.id,
        shipmentId: quotes.shipmentId,
        cost: quotes.cost,
        sailingDate: quotes.sailingDate,
        carrierName: quotes.carrierName,
        submittedAt: quotes.submittedAt,
        isWinner: quotes.isWinner,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        clientEmail: users.email,
        clientCompany: users.company,
      })
      .from(quotes)
      .innerJoin(shipments, eq(quotes.shipmentId, shipments.id))
      .innerJoin(users, eq(shipments.clientId, users.id))
      .where(eq(shipments.status, status));

    // Transform the data to match the expected format
    const transformedQuotes = quotesData.map((quote) => ({
      id: quote.id,
      shipmentId: quote.shipmentId,
      client: quote.clientCompany || quote.clientEmail,
      containerType: quote.containerType || "N/A",
      cost: Number(quote.cost),
      sailingDate: quote.sailingDate.toISOString(),
      carrierName: quote.carrierName,
      status: status,
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
    const { quoteId, action } = body;

    if (!quoteId || !action) {
      return NextResponse.json(
        { error: "Missing quoteId or action" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update the quote to mark it as winner
      await db
        .update(quotes)
        .set({ isWinner: true })
        .where(eq(quotes.id, quoteId));

      // Get the shipment ID for this quote
      const quoteData = await db
        .select({ shipmentId: quotes.shipmentId })
        .from(quotes)
        .where(eq(quotes.id, quoteId));

      if (quoteData.length > 0) {
        // Update the shipment status to booked
        await db
          .update(shipments)
          .set({ status: "booked" })
          .where(eq(shipments.id, quoteData[0].shipmentId));
      }

      return NextResponse.json({ success: true });
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
