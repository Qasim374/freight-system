import { NextResponse } from "next/server";
import { eq, and, count, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  quotes,
  quoteBids,
  shipments,
  billsOfLading,
  invoices,
  amendments,
} from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get quote requests (quotes awaiting bids)
    const [quoteRequests] = await db
      .select({ count: count() })
      .from(quotes)
      .where(
        and(
          eq(quotes.clientId, parseInt(userId)),
          eq(quotes.status, "awaiting_bids")
        )
      );

    // Get pending BL approvals (BLs awaiting client approval)
    const [pendingBLs] = await db
      .select({ count: count() })
      .from(billsOfLading)
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .where(
        and(
          eq(shipments.clientId, parseInt(userId)),
          eq(billsOfLading.blStatus, "awaiting_client_approval")
        )
      );

    // Get unpaid invoices
    const [unpaidInvoices] = await db
      .select({ count: count() })
      .from(invoices)
      .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .where(
        and(
          eq(shipments.clientId, parseInt(userId)),
          eq(invoices.status, "unpaid")
        )
      );

    // Get recent quotes
    const recentQuotes = await db
      .select({
        id: quotes.id,
        status: quotes.status,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        numContainers: quotes.numContainers,
        shipmentDate: quotes.shipmentDate,
        createdAt: quotes.createdAt,
        finalPrice: quotes.finalPrice,
      })
      .from(quotes)
      .where(eq(quotes.clientId, parseInt(userId)))
      .orderBy(desc(quotes.createdAt))
      .limit(5);

    // Get recent shipments
    const recentShipments = await db
      .select({
        id: shipments.id,
        shipmentStatus: shipments.shipmentStatus,
        trackingStatus: shipments.trackingStatus,
        carrierReference: shipments.carrierReference,
        eta: shipments.eta,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(shipments.createdAt))
      .limit(5);

    // Get pending amendments
    const [pendingAmendments] = await db
      .select({ count: count() })
      .from(amendments)
      .innerJoin(billsOfLading, eq(amendments.blId, billsOfLading.id))
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .where(
        and(
          eq(shipments.clientId, parseInt(userId)),
          eq(amendments.status, "requested")
        )
      );

    return NextResponse.json({
      quoteRequests: quoteRequests.count,
      pendingBLs: pendingBLs.count,
      unpaidInvoices: unpaidInvoices.count,
      pendingAmendments: pendingAmendments.count,
      recentQuotes,
      recentShipments,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
