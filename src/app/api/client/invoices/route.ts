import { NextResponse } from "next/server";
import { eq, desc, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - List client's invoices
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientInvoices = await db
      .select({
        id: invoices.id,
        shipmentId: invoices.shipmentId,
        userId: invoices.userId,
        amount: invoices.amount,
        type: invoices.type,
        status: invoices.status,
        dueDate: invoices.dueDate,
        paymentMethod: invoices.paymentMethod,
        proofUploaded: invoices.proofUploaded,
        adminMarginReportGenerated: invoices.adminMarginReportGenerated,
        createdAt: invoices.createdAt,
        // Quote details for shipment info
        commodity: quotes.commodity,
        containerType: quotes.containerType,
        mode: quotes.mode,
        collectionAddress: quotes.collectionAddress,
        shipmentDate: quotes.shipmentDate,
      })
      .from(invoices)
      .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .innerJoin(quotes, eq(shipments.quoteId, quotes.id))
      .where(
        or(
          eq(shipments.clientId, parseInt(userId)),
          eq(invoices.userId, parseInt(userId))
        )
      )
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({
      invoices: clientInvoices.map((invoice) => ({
        ...invoice,
        amount: invoice.amount ? Number(invoice.amount) : null,
        adminMarginReportGenerated: Boolean(invoice.adminMarginReportGenerated),
        createdAt: invoice.createdAt?.toISOString() || new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error("Client invoices API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
