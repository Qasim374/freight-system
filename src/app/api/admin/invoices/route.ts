import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { invoices, shipments, users } from "@/lib/schema";

type InvoiceType = "client" | "vendor";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type") || "client";

  // Validate type parameter
  const validTypes: InvoiceType[] = ["client", "vendor"];
  const type: InvoiceType = validTypes.includes(typeParam as InvoiceType)
    ? (typeParam as InvoiceType)
    : "client";

  try {
    const invoiceData = await db
      .select({
        id: invoices.id,
        shipmentId: invoices.shipmentId,
        amount: invoices.amount,
        type: invoices.type,
        status: invoices.status,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        clientEmail: users.email,
        clientCompany: users.company,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
      })
      .from(invoices)
      .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .innerJoin(users, eq(shipments.clientId, users.id))
      .where(eq(invoices.type, type));

    console.log(invoiceData);
    return NextResponse.json(
      invoiceData.map((i) => ({
        id: i.id,
        shipmentId: i.shipmentId,
        amount: Number(i.amount),
        type: i.type,
        status: i.status,
        dueDate: i.dueDate ? i.dueDate.toISOString() : null,
        createdAt: i.createdAt?.toISOString() || new Date().toISOString(),
        client: i.clientCompany || i.clientEmail,
        containerType: i.containerType || "N/A",
        commodity: i.commodity || "N/A",
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
