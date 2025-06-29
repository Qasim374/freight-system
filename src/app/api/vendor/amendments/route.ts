import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, shipments, billsOfLading } from "@/lib/schema";
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

    // Get amendments for shipments assigned to this vendor
    const vendorAmendments = await db
      .select({
        id: amendments.id,
        shipmentId: billsOfLading.shipmentId,
        requestType: amendments.initiatedBy,
        description: amendments.reason,
        status: amendments.status,
        createdAt: amendments.createdAt,
        extraCost: amendments.extraCost,
        delayDays: amendments.delayDays,
        reason: amendments.reason,
      })
      .from(amendments)
      .leftJoin(billsOfLading, eq(amendments.blId, billsOfLading.id))
      .leftJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .where(eq(shipments.vendorId, vendorId));

    return NextResponse.json({
      amendments: vendorAmendments.map((amendment) => ({
        id: amendment.id,
        shipmentId: amendment.shipmentId,
        requestType: amendment.requestType,
        description: amendment.description,
        status: amendment.status,
        createdAt: amendment.createdAt.toISOString(),
        extraCost: amendment.extraCost,
        delayDays: amendment.delayDays,
        reason: amendment.reason,
      })),
    });
  } catch (error) {
    console.error("Vendor amendments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
