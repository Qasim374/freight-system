import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";
import { v4 as uuidv4 } from "uuid";

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
        id: shipments.id,
        status: shipments.status,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        numberOfContainers: shipments.numberOfContainers,
        preferredShipmentDate: shipments.preferredShipmentDate,
        createdAt: shipments.createdAt,
        quoteDeadline: shipments.quoteDeadline,
        quoteRequestedAt: shipments.quoteRequestedAt,
      })
      .from(shipments)
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(shipments.createdAt));

    // Get quote counts for each shipment
    const quotesWithCounts = await Promise.all(
      clientQuotes.map(async (shipment) => {
        const quoteCount = await db
          .select({ count: quotes.id })
          .from(quotes)
          .where(eq(quotes.shipmentId, shipment.id));

        return {
          ...shipment,
          quotes: quoteCount,
        };
      })
    );

    return NextResponse.json({
      quotes: quotesWithCounts,
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
      numberOfContainers,
      commodity,
      weightPerContainer,
      preferredShipmentDate,
      collectionAddress,
    } = body;

    // Validate required fields
    if (
      !mode ||
      !containerType ||
      !numberOfContainers ||
      !commodity ||
      !preferredShipmentDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate shipment ID
    const shipmentId = uuidv4();

    // Calculate 48-hour deadline
    const quoteDeadline = new Date();
    quoteDeadline.setHours(quoteDeadline.getHours() + 48);

    // Create shipment
    await db.insert(shipments).values({
      id: shipmentId,
      clientId: parseInt(userId),
      status: "quote_requested",
      containerType,
      commodity,
      weightPerContainer,
      preferredShipmentDate: new Date(preferredShipmentDate),
      collectionAddress: mode === "Ex-Works" ? collectionAddress : null,
      quoteRequestedAt: new Date(),
      quoteDeadline,
    });

    // TODO: Route request to assigned vendors (this would be implemented in a separate service)
    console.log(`Quote request ${shipmentId} created. Routing to vendors...`);

    return NextResponse.json({
      id: shipmentId,
      message: "Quote request created successfully. Vendors will be notified.",
      deadline: quoteDeadline,
    });
  } catch (error) {
    console.error("Create quote API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
