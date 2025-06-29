import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { invoices, users } from "@/lib/schema";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user.role.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type") || "client";
    const statusParam = searchParams.get("status") || "all";

    // Validate type parameter
    const validTypes = ["client", "vendor"];
    const type = validTypes.includes(typeParam) ? typeParam : "client";

    // Build query
    let query = db
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
        clientEmail: users.email,
        clientCompany: users.company,
      })
      .from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.type, type));

    // Apply status filter if not "all"
    if (statusParam !== "all") {
      query = query.where(eq(invoices.status, statusParam));
    }

    const invoicesData = await query;

    // Transform the data to match the expected format
    const transformedInvoices = invoicesData.map((invoice) => ({
      id: invoice.id,
      shipmentId: invoice.shipmentId,
      userId: invoice.userId,
      amount: Number(invoice.amount),
      type: invoice.type,
      status: invoice.status,
      dueDate: invoice.dueDate?.toISOString() || null,
      paymentMethod: invoice.paymentMethod,
      proofUploaded: invoice.proofUploaded,
      adminMarginReportGenerated: Boolean(invoice.adminMarginReportGenerated),
      createdAt: invoice.createdAt.toISOString(),
      client: invoice.clientCompany || invoice.clientEmail,
    }));

    return NextResponse.json(transformedInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user.role.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { invoiceId, action } = body;

    if (!invoiceId || !action) {
      return NextResponse.json(
        { error: "Missing invoiceId or action" },
        { status: 400 }
      );
    }

    if (action === "mark_paid") {
      // Update the invoice to mark it as paid
      await db
        .update(invoices)
        .set({ status: "paid" })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json({ success: true });
    }

    if (action === "mark_unpaid") {
      // Update the invoice to mark it as unpaid
      await db
        .update(invoices)
        .set({ status: "unpaid" })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json({ success: true });
    }

    if (action === "mark_awaiting_verification") {
      // Update the invoice to mark it as awaiting verification
      await db
        .update(invoices)
        .set({ status: "awaiting_verification" })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}
