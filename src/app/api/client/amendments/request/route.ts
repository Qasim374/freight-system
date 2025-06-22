import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { amendments, shipments } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// POST - Request amendment
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const shipmentId = formData.get("shipmentId") as string;
    const reason = formData.get("reason") as string;
    const file = formData.get("file") as File;

    if (!shipmentId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify shipment belongs to client
    const shipmentData = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .where(eq(shipments.clientId, parseInt(userId)))
      .limit(1);

    if (shipmentData.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // TODO: Upload file to cloud storage if provided
    if (file) {
      console.log("Amendment file uploaded:", file.name);
    }

    // Create amendment request
    const [newAmendment] = await db
      .insert(amendments)
      .values({
        shipmentId,
        reason,
        status: "requested",
        actorId: parseInt(userId),
      })
      .returning();

    // TODO: Notify admin about amendment request
    console.log(`Amendment request created for shipment ${shipmentId}`);

    return NextResponse.json({
      id: newAmendment.id,
      message: "Amendment request submitted successfully",
    });
  } catch (error) {
    console.error("Amendment request API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 