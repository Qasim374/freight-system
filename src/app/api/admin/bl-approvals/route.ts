import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq } from "drizzle-orm";
import { billsOfLading, shipments, users } from "@/lib/schema";

export async function GET() {
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

    // Fetch bills of lading with shipment and client information
    const blsData = await db
      .select({
        id: billsOfLading.id,
        shipmentId: billsOfLading.shipmentId,
        version: billsOfLading.version,
        fileUrl: billsOfLading.fileUrl,
        approved: billsOfLading.approved,
        uploadedAt: billsOfLading.uploadedAt,
        clientEmail: users.email,
        clientCompany: users.company,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
      })
      .from(billsOfLading)
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .innerJoin(users, eq(shipments.clientId, users.id))
      .orderBy(billsOfLading.uploadedAt);

    // Transform the data to match the expected format
    const transformedBLs = blsData.map((bl) => ({
      id: bl.id,
      shipmentId: bl.shipmentId,
      version: bl.version,
      fileUrl: bl.fileUrl,
      approved: bl.approved,
      uploadedAt: bl.uploadedAt?.toISOString() || new Date().toISOString(),
      client: bl.clientCompany || bl.clientEmail,
      containerType: bl.containerType || "N/A",
      commodity: bl.commodity || "N/A",
    }));

    return NextResponse.json(transformedBLs);
  } catch (error) {
    console.error("Error fetching bills of lading:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills of lading" },
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
    const { blId, action } = body;

    if (!blId || !action) {
      return NextResponse.json(
        { error: "Missing blId or action" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update the bill of lading to mark it as approved
      await db
        .update(billsOfLading)
        .set({ approved: true })
        .where(eq(billsOfLading.id, blId));

      // Get the shipment ID for this BL
      const blData = await db
        .select({
          shipmentId: billsOfLading.shipmentId,
          version: billsOfLading.version,
        })
        .from(billsOfLading)
        .where(eq(billsOfLading.id, blId));

      if (blData.length > 0) {
        // Update the shipment status based on BL version
        const newStatus =
          blData[0].version === "final" ? "final_bl" : "draft_bl";

        await db
          .update(shipments)
          .set({ status: newStatus })
          .where(eq(shipments.id, blData[0].shipmentId));
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating bill of lading:", error);
    return NextResponse.json(
      { error: "Failed to update bill of lading" },
      { status: 500 }
    );
  }
}
