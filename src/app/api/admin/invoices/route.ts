import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { invoices, shipments } from "@/lib/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "client";

  try {
    const invoiceData = await db
      .select()
      .from(invoices)
      .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .where(eq(invoices.type, type));

    return NextResponse.json(
      invoiceData.map((i) => ({
        id: i.invoices.id,
        shipmentId: i.invoices.shipmentId,
        amount: i.invoices.amount,
        type: i.invoices.type,
        status: i.invoices.status,
        dueDate: i.invoices.dueDate,
        createdAt: i.invoices.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { invoiceId, action } = await request.json();

    if (action === "paid") {
      await db
        .update(invoices)
        .set({ status: "paid" })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
