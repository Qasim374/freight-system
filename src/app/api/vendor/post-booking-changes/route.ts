import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, amendments, billsOfLading } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

// POST - Vendor proposes post-booking changes
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shipmentId, reason, extraCost, delayDays, changeType, fileUpload } =
      body;

    if (!shipmentId || !reason || !changeType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vendorId = parseInt(userId);

    // Verify shipment belongs to this vendor
    const shipment = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.id, parseInt(shipmentId)),
          eq(shipments.vendorId, vendorId)
        )
      )
      .limit(1);

    if (shipment.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get BL record for this shipment
    const blRecord = await db
      .select()
      .from(billsOfLading)
      .where(eq(billsOfLading.shipmentId, parseInt(shipmentId)))
      .limit(1);

    if (blRecord.length === 0) {
      return NextResponse.json(
        { error: "Bill of Lading record not found" },
        { status: 404 }
      );
    }

    // Create amendment request for post-booking change
    const [newAmendment] = await db
      .insert(amendments)
      .values({
        blId: blRecord[0].id,
        initiatedBy: "vendor",
        reason: `Post-booking change: ${reason}`,
        fileUpload: fileUpload || null,
        extraCost: extraCost ? extraCost.toString() : null,
        delayDays: delayDays || null,
        status: "requested",
        createdAt: new Date(),
      })
      .returning();

    // Log the change request
    await db.insert(shipmentLogs).values({
      shipmentId: parseInt(shipmentId),
      actor: `Vendor ${vendorId}`,
      action: "post_booking_change_requested",
      details: JSON.stringify({
        reason,
        extraCost,
        delayDays,
        changeType,
        amendmentId: newAmendment.id,
      }),
    });

    return NextResponse.json({
      message: "Post-booking change request submitted successfully",
      amendmentId: newAmendment.id,
    });
  } catch (error) {
    console.error("Post-booking change API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get post-booking changes for vendor's shipments
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendorId = parseInt(userId);

    // Get post-booking changes for vendor's shipments
    const changes = await db
      .select({
        id: amendments.id,
        shipmentId: billsOfLading.shipmentId,
        reason: amendments.reason,
        extraCost: amendments.extraCost,
        delayDays: amendments.delayDays,
        status: amendments.status,
        createdAt: amendments.createdAt,
        clientResponseAt: amendments.clientResponseAt,
        adminReviewAt: amendments.adminReviewAt,
      })
      .from(amendments)
      .innerJoin(billsOfLading, eq(amendments.blId, billsOfLading.id))
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .where(
        and(
          eq(shipments.vendorId, vendorId),
          eq(amendments.initiatedBy, "vendor")
        )
      )
      .orderBy(amendments.createdAt);

    return NextResponse.json({
      changes: changes.map((change) => ({
        id: change.id,
        shipmentId: change.shipmentId,
        reason: change.reason,
        extraCost: change.extraCost ? Number(change.extraCost) : null,
        delayDays: change.delayDays,
        status: change.status,
        createdAt: change.createdAt.toISOString(),
        clientResponseAt: change.clientResponseAt?.toISOString() || null,
        adminReviewAt: change.adminReviewAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Get post-booking changes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Import shipmentLogs schema
import { shipmentLogs } from "@/lib/schema";
