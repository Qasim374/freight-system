import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, quotes, billsOfLading } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get shipment tracking data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const shipmentId = params.id;

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get shipment with tracking data
    const shipmentData = await db
      .select({
        id: shipments.id,
        status: shipments.status,
        commodity: shipments.commodity,
        containerType: shipments.containerType,
        carrierReference: shipments.carrierReference,
        eta: shipments.eta,
        sailingDate: shipments.sailingDate,
        loadingDate: shipments.loadingDate,
        deliveredDate: shipments.deliveredDate,
        finalPrice: shipments.finalPrice,
        winningQuoteId: shipments.winningQuoteId,
        hasDraftBL: shipments.hasDraftBL,
        hasFinalBL: shipments.hasFinalBL,
      })
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (shipmentData.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    const shipment = shipmentData[0];

    // Verify the shipment belongs to the client
    const clientShipment = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (clientShipment.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Bill of Lading information
    const blData = await db
      .select({
        version: billsOfLading.version,
        fileUrl: billsOfLading.fileUrl,
        approved: billsOfLading.approved,
      })
      .from(billsOfLading)
      .where(eq(billsOfLading.shipmentId, shipmentId));

    let draftBLUrl = null;
    let finalBLUrl = null;

    blData.forEach((bl) => {
      if (bl.version === "draft") {
        draftBLUrl = bl.fileUrl;
      } else if (bl.version === "final") {
        finalBLUrl = bl.fileUrl;
      }
    });

    // If there's a winning quote, get additional details
    let quoteDetails = null;
    if (shipment.winningQuoteId) {
      const quoteData = await db
        .select({
          id: quotes.id,
          cost: quotes.cost,
          sailingDate: quotes.sailingDate,
          carrierName: quotes.carrierName,
        })
        .from(quotes)
        .where(eq(quotes.id, shipment.winningQuoteId))
        .limit(1);

      if (quoteData.length > 0) {
        quoteDetails = quoteData[0];
      }
    }

    return NextResponse.json({
      shipment: {
        ...shipment,
        draftBLUrl,
        finalBLUrl,
        quoteDetails,
      },
    });
  } catch (error) {
    console.error("Shipment tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
