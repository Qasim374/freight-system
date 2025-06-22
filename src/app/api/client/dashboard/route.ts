import { NextResponse } from "next/server";
import { eq, and, count, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, billsOfLading, invoices } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get quote requests
    const [quoteRequests] = await db
      .select({ count: count() })
      .from(shipments)
      .where(
        and(
          eq(shipments.clientId, parseInt(userId)),
          eq(shipments.status, "quote_requested")
        )
      );

    // Get pending BL approvals
    const [pendingBLs] = await db
      .select({ count: count() })
      .from(billsOfLading)
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .where(
        and(
          eq(shipments.clientId, parseInt(userId)),
          eq(billsOfLading.approved, false)
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
          eq(invoices.status, "unpaid"),
          eq(invoices.type, "client")
        )
      );

    // Get recent shipments
    const recentShipments = await db
      .select()
      .from(shipments)
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(shipments.createdAt))
      .limit(5);

    return NextResponse.json({
      quoteRequests: quoteRequests.count,
      pendingBLs: pendingBLs.count,
      unpaidInvoices: unpaidInvoices.count,
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
