import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, shipments, quotes } from "@/lib/schema";
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

    // Get invoices for shipments assigned to this vendor
    const vendorInvoices = await db
      .select({
        id: invoices.id,
        shipmentId: invoices.shipmentId,
        invoiceNumber: invoices.id, // Using id as invoice number for now
        amount: invoices.amount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        paidDate: invoices.createdAt, // Using createdAt as paidDate for now
        invoiceUrl: invoices.proofUploaded,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        collectionAddress: quotes.collectionAddress,
      })
      .from(invoices)
      .leftJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .leftJoin(quotes, eq(shipments.quoteId, quotes.id))
      .where(eq(shipments.vendorId, vendorId));

    return NextResponse.json({
      invoices: vendorInvoices.map((invoice) => ({
        id: invoice.id,
        shipmentId: invoice.shipmentId,
        invoiceNumber: `INV-${invoice.invoiceNumber}`,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate.toISOString(),
        paidDate: invoice.paidDate?.toISOString(),
        invoiceUrl: invoice.invoiceUrl,
        containerType: invoice.containerType,
        commodity: invoice.commodity,
        origin: invoice.collectionAddress, // Using collectionAddress as origin
        destination: "N/A", // Not available in current schema
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
