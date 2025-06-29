import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { billsOfLading, shipments, users } from "@/lib/schema";

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
    const versionParam = searchParams.get("version") || "draft";

    // Validate version parameter
    const validVersions = ["draft", "final"];
    const version = validVersions.includes(versionParam)
      ? versionParam
      : "draft";

    // Fetch bills of lading with shipment and client information
    const blData = await db
      .select({
        id: billsOfLading.id,
        shipmentId: billsOfLading.shipmentId,
        vendorId: billsOfLading.vendorId,
        draftBl: billsOfLading.draftBl,
        finalBl: billsOfLading.finalBl,
        blStatus: billsOfLading.blStatus,
        approvedByClient: billsOfLading.approvedByClient,
        remarks: billsOfLading.remarks,
        finalizedAt: billsOfLading.finalizedAt,
        createdAt: billsOfLading.createdAt,
        clientEmail: users.email,
        clientCompany: users.company,
      })
      .from(billsOfLading)
      .innerJoin(shipments, eq(billsOfLading.shipmentId, shipments.id))
      .innerJoin(users, eq(shipments.clientId, users.id))
      .where(
        version === "draft"
          ? eq(billsOfLading.blStatus, "draft_uploaded")
          : eq(billsOfLading.blStatus, "final_uploaded")
      );

    // Transform the data to match the expected format
    const transformedBLs = blData.map((bl) => ({
      id: bl.id,
      shipmentId: bl.shipmentId,
      vendorId: bl.vendorId,
      version: version,
      fileUrl: version === "draft" ? bl.draftBl : bl.finalBl,
      uploadedBy: bl.vendorId,
      approved: bl.approvedByClient,
      uploadedAt: bl.createdAt.toISOString(),
      client: bl.clientCompany || bl.clientEmail,
      blStatus: bl.blStatus,
      remarks: bl.remarks,
      finalizedAt: bl.finalizedAt?.toISOString() || null,
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
        .set({
          approvedByClient: true,
          blStatus: "final_approved",
        })
        .where(eq(billsOfLading.id, blId));

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      // Update the bill of lading to mark it as not approved
      await db
        .update(billsOfLading)
        .set({
          approvedByClient: false,
          blStatus: "amendment_requested",
        })
        .where(eq(billsOfLading.id, blId));

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
