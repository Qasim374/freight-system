import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes } from "@/lib/schema";
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
      .select()
      .from(shipments)
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(shipments.createdAt));

    // Get quotes for each shipment
    const quotesWithVendorQuotes = await Promise.all(
      clientQuotes.map(async (shipment) => {
        const vendorQuotes = await db
          .select()
          .from(quotes)
          .where(eq(quotes.shipmentId, shipment.id));

        return {
          ...shipment,
          quotes: vendorQuotes,
        };
      })
    );

    return NextResponse.json({
      quotes: quotesWithVendorQuotes,
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

  console.log("API Debug - userId:", userId, "userRole:", userRole);

  if (!userId || !userRole || !isClientRole(userRole)) {
    console.log(
      "API Debug - Auth failed. userId:",
      !!userId,
      "userRole:",
      !!userRole,
      "isClientRole:",
      isClientRole(userRole || "")
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      containerType,
      commodity,
      weightPerContainer,
      preferredShipmentDate,
      collectionAddress,
    } = body;

    // Validate required fields
    if (!containerType || !commodity || !preferredShipmentDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new shipment (quote request)
    const shipmentId = crypto.randomUUID();
    await db.insert(shipments).values({
      id: shipmentId,
      clientId: parseInt(userId),
      status: "quote_requested",
      containerType,
      commodity,
      weightPerContainer: weightPerContainer || 0,
      preferredShipmentDate: new Date(preferredShipmentDate),
      collectionAddress: collectionAddress || null,
    });

    return NextResponse.json({
      id: shipmentId,
      message: "Quote request created successfully",
    });
  } catch (error) {
    console.error("Create quote API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
