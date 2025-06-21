import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import { shipments, amendments, invoices } from "@/lib/schema";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user.role.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection first
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error("Database connection failed");
      return NextResponse.json(
        {
          error: "Database connection failed",
          quoteRequests: 0,
          pendingAmendments: 0,
          unpaidInvoices: 0,
        },
        { status: 503 }
      );
    }

    // Fetch stats with individual error handling
    let quoteRequests = 0;
    let pendingAmendments = 0;
    let unpaidInvoices = 0;

    try {
      const quoteRequestsResult = await db
        .select({ count: count() })
        .from(shipments)
        .where(eq(shipments.status, "quote_requested"));
      quoteRequests = quoteRequestsResult[0]?.count || 0;
    } catch (error) {
      console.error("Error fetching quote requests:", error);
    }

    try {
      const pendingAmendmentsResult = await db
        .select({ count: count() })
        .from(amendments)
        .where(eq(amendments.status, "admin_review"));
      pendingAmendments = pendingAmendmentsResult[0]?.count || 0;
    } catch (error) {
      console.error("Error fetching pending amendments:", error);
    }

    try {
      const unpaidInvoicesResult = await db
        .select({ count: count() })
        .from(invoices)
        .where(eq(invoices.status, "unpaid"));
      unpaidInvoices = unpaidInvoicesResult[0]?.count || 0;
    } catch (error) {
      console.error("Error fetching unpaid invoices:", error);
    }

    return NextResponse.json({
      quoteRequests,
      pendingAmendments,
      unpaidInvoices,
    });
  } catch (error) {
    console.error("Error in dashboard stats API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        quoteRequests: 0,
        pendingAmendments: 0,
        unpaidInvoices: 0,
      },
      { status: 500 }
    );
  }
}
