import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, quotes, shipments } from "@/lib/schema";
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

    // Get invoices for shipments where this vendor won the quote
    const vendorInvoices = await db
      .select({
        id: invoices.id,
        shipmentId: invoices.shipmentId,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        invoiceUrl: invoices.invoiceUrl,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
        origin: shipments.origin,
        destination: shipments.destination,
      })
      .from(invoices)
      .leftJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .leftJoin(quotes, eq(shipments.id, quotes.shipmentId))
      .where(
        and(
          eq(quotes.vendorId, vendorId),
          eq(quotes.isWinner, true)
        )
      );

    return NextResponse.json({
      invoices: vendorInvoices.map((invoice) => ({
        id: invoice.id,
        shipmentId: invoice.shipmentId,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate.toISOString(),
        paidDate: invoice.paidDate?.toISOString(),
        invoiceUrl: invoice.invoiceUrl,
        containerType: invoice.containerType,
        commodity: invoice.commodity,
        origin: invoice.origin,
        destination: invoice.destination,
      })),
    });
  } catch (error) {
    console.error("Vendor invoices API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 