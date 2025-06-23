import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Respond to amendment request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const amendmentId = parseInt(params.id);

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(amendmentId)) {
    return NextResponse.json(
      { error: "Invalid amendment ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !["accept", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'cancel'" },
        { status: 400 }
      );
    }

    // Get amendment with shipment verification
    const amendmentData = await db
      .select({
        id: amendments.id,
        shipmentId: amendments.shipmentId,
        status: amendments.status,
      })
      .from(amendments)
      .innerJoin(shipments, eq(amendments.shipmentId, shipments.id))
      .where(eq(amendments.id, amendmentId))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (amendmentData.length === 0) {
      return NextResponse.json(
        { error: "Amendment not found" },
        { status: 404 }
      );
    }

    const amendment = amendmentData[0];

    // Check if amendment is in client_review status
    if (amendment.status !== "client_review") {
      return NextResponse.json(
        { error: "Amendment is not ready for client review" },
        { status: 400 }
      );
    }

    // Update amendment status based on action
    const newStatus = action === "accept" ? "accepted" : "rejected";

    await db
      .update(amendments)
      .set({ status: newStatus })
      .where(eq(amendments.id, amendmentId));

    // If accepted, update shipment status back to draft_bl to continue workflow
    if (action === "accept") {
      await db
        .update(shipments)
        .set({ status: "draft_bl" })
        .where(eq(shipments.id, amendment.shipmentId));
    }

    return NextResponse.json({
      success: true,
      message: `Amendment ${
        action === "accept" ? "accepted" : "cancelled"
      } successfully`,
    });
  } catch (error) {
    console.error("Amendment response API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
