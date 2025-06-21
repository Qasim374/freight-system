import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sql, count, eq } from "drizzle-orm";
import { shipments, quotes, invoices } from "@/lib/schema";

export async function GET() {
  try {
    // Shipment status distribution
    const shipmentStatus = await db
      .select({
        status: shipments.status,
        count: count(),
      })
      .from(shipments)
      .groupBy(shipments.status);

    // Revenue by month
    const revenueByMonth = await db
      .select({
        month: sql<string>`DATE_FORMAT(${invoices.createdAt}, '%Y-%m')`,
        revenue: sql<number>`SUM(${invoices.amount})`,
      })
      .from(invoices)
      .where(eq(invoices.type, "client"))
      .groupBy(sql`DATE_FORMAT(${invoices.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${invoices.createdAt}, '%Y-%m')`);

    // Invoice status distribution
    const invoiceStatus = await db
      .select({
        status: invoices.status,
        value: count(),
      })
      .from(invoices)
      .groupBy(invoices.status);

    // Quote volume by month
    const quoteVolume = await db
      .select({
        month: sql<string>`DATE_FORMAT(${quotes.submittedAt}, '%Y-%m')`,
        quotes: count(),
      })
      .from(quotes)
      .groupBy(sql`DATE_FORMAT(${quotes.submittedAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${quotes.submittedAt}, '%Y-%m')`);

    return NextResponse.json({
      shipmentStatus,
      revenueByMonth,
      invoiceStatus,
      quoteVolume,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
