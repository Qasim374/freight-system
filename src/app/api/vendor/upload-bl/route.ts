import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { billsOfLading, shipments } from "@/lib/schema";
import { isVendorRole } from "@/lib/auth-utils";

export async function POST(request: Request) {
  // Get user info from headers (for server-side API calls)
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isVendorRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const shipmentId = formData.get("shipmentId") as string;
    const blType = formData.get("blType") as string;

    if (!file || !shipmentId || !blType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vendorId = parseInt(userId);

    // Verify that this shipment is assigned to this vendor
    const assignedShipment = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId) && eq(shipments.vendorId, vendorId));

    if (assignedShipment.length === 0) {
      return NextResponse.json(
        { error: "You are not authorized to upload BL for this shipment" },
        { status: 403 }
      );
    }

    // For now, we'll store the file name as a placeholder
    // In a real implementation, you'd upload to cloud storage and store the URL
    const fileName = `${shipmentId}_${blType}_${Date.now()}.pdf`;
    const fileUrl = `/uploads/bls/${fileName}`; // This would be the actual cloud storage URL

    // Check if BL record exists for this shipment
    const existingBL = await db
      .select()
      .from(billsOfLading)
      .where(eq(billsOfLading.shipmentId, shipmentId));

    if (existingBL.length > 0) {
      // Update existing record
      if (blType === "draft") {
        await db
          .update(billsOfLading)
          .set({
            draftBl: fileUrl,
            blStatus: "draft_uploaded",
          })
          .where(eq(billsOfLading.shipmentId, shipmentId));
      } else {
        await db
          .update(billsOfLading)
          .set({
            finalBl: fileUrl,
            blStatus: "final_uploaded",
          })
          .where(eq(billsOfLading.shipmentId, shipmentId));
      }
    } else {
      // Create new record
      await db.insert(billsOfLading).values({
        shipmentId,
        vendorId,
        draftBl: blType === "draft" ? fileUrl : null,
        finalBl: blType === "final" ? fileUrl : null,
        blStatus: blType === "draft" ? "draft_uploaded" : "final_uploaded",
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      message: `${
        blType === "draft" ? "Draft" : "Final"
      } BL uploaded successfully`,
      fileUrl,
    });
  } catch (error) {
    console.error("Vendor upload BL API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
