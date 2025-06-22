import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, shipments } from "@/lib/schema";
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
        amount: invoices.amount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        type: invoices.type,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({
      invoices: clientInvoices,
    });
  } catch (error) {
    console.error("Client invoices API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
