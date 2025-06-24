import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, billsOfLading, shipments, quotes } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get all amendments for client
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseQuery = db
      .select({
        id: amendments.id,
        blId: amendments.blId,
        shipmentId: shipments.id,
        reason: amendments.reason,
        extraCost: amendments.extraCost,
        markupAmount: amendments.markupAmount,
        delayDays: amendments.delayDays,
        status: amendments.status,
        initiatedBy: amendments.initiatedBy,
        approvedBy: amendments.approvedBy,
        clientResponseAt: amendments.clientResponseAt,
        adminReviewAt: amendments.adminReviewAt,
        vendorReplyAt: amendments.vendorReplyAt,
        createdAt: amendments.createdAt,
        // Quote details for shipment info
        commodity: quotes.commodity,
        containerType: quotes.containerType,
        mode: quotes.mode,
        collectionAddress: quotes.collectionAddress,
        shipmentDate: quotes.shipmentDate,
      })
      .from(amendments)
      .innerJoin(billsOfLading, eq(amendments.blId, billsOfLading.id))
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .innerJoin(quotes, eq(shipments.quoteId, quotes.id));

    // Build where conditions
    const whereConditions = [eq(shipments.clientId, parseInt(userId))];

    // Apply status filter if provided
    if (statusFilter && statusFilter !== "all") {
      whereConditions.push(
        eq(
          amendments.status,
          statusFilter as
            | "requested"
            | "vendor_replied"
            | "admin_review"
            | "client_review"
            | "accepted"
            | "rejected"
        )
      );
    }

    const amendmentsData = await baseQuery
      .where(and(...whereConditions))
      .orderBy(amendments.createdAt);

    return NextResponse.json({
      amendments: amendmentsData.map((amendment) => ({
        ...amendment,
        extraCost: amendment.extraCost ? Number(amendment.extraCost) : null,
        markupAmount: amendment.markupAmount
          ? Number(amendment.markupAmount)
          : null,
        clientResponseAt: amendment.clientResponseAt?.toISOString() || null,
        adminReviewAt: amendment.adminReviewAt?.toISOString() || null,
        vendorReplyAt: amendment.vendorReplyAt?.toISOString() || null,
        createdAt:
          amendment.createdAt?.toISOString() || new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error("Client amendments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
