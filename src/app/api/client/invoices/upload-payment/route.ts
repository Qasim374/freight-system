import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Upload payment proof
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const invoiceId = formData.get("invoiceId") as string;
    const paymentProof = formData.get("paymentProof") as File;

    if (!invoiceId || !paymentProof) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify invoice belongs to client
    const invoiceData = await db
      .select()
      .from(invoices)
      .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .where(eq(invoices.id, parseInt(invoiceId)))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (invoiceData.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // TODO: Upload file to cloud storage (AWS S3, etc.)
    // For now, we'll just update the status
    console.log("Payment proof uploaded:", paymentProof.name);

    // Update invoice status to awaiting verification
    await db
      .update(invoices)
      .set({
        status: "awaiting_verification",
      })
      .where(eq(invoices.id, parseInt(invoiceId)));

    return NextResponse.json({
      message: "Payment proof uploaded successfully",
      status: "awaiting_verification",
    });
  } catch (error) {
    console.error("Upload payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
