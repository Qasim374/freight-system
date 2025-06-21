import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq } from "drizzle-orm";
import { amendments, shipments, users } from "@/lib/schema";

type AmendmentStatus =
  | "requested"
  | "vendor_replied"
  | "admin_review"
  | "client_review"
  | "accepted"
  | "rejected";

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
    const statusParam = searchParams.get("status") || "requested";

    // Validate status parameter
    const validStatuses: AmendmentStatus[] = [
      "requested",
      "vendor_replied",
      "admin_review",
      "client_review",
      "accepted",
      "rejected",
    ];
    const status: AmendmentStatus = validStatuses.includes(
      statusParam as AmendmentStatus
    )
      ? (statusParam as AmendmentStatus)
      : "requested";

    // Fetch amendments with shipment and client information
    const amendmentsData = await db
      .select({
        id: amendments.id,
        shipmentId: amendments.shipmentId,
        reason: amendments.reason,
        extraCost: amendments.extraCost,
        delayDays: amendments.delayDays,
        status: amendments.status,
        createdAt: amendments.createdAt,
        clientEmail: users.email,
        clientCompany: users.company,
        containerType: shipments.containerType,
        commodity: shipments.commodity,
      })
      .from(amendments)
      .innerJoin(shipments, eq(amendments.shipmentId, shipments.id))
      .innerJoin(users, eq(shipments.clientId, users.id))
      .where(eq(amendments.status, status));

    // Transform the data to match the expected format
    const transformedAmendments = amendmentsData.map((amendment) => ({
      id: amendment.id,
      shipmentId: amendment.shipmentId,
      reason: amendment.reason,
      extraCost: Number(amendment.extraCost),
      delayDays: amendment.delayDays,
      status: amendment.status,
      createdAt: amendment.createdAt.toISOString(),
      client: amendment.clientCompany || amendment.clientEmail,
      containerType: amendment.containerType || "N/A",
      commodity: amendment.commodity || "N/A",
    }));

    return NextResponse.json(transformedAmendments);
  } catch (error) {
    console.error("Error fetching amendments:", error);
    return NextResponse.json(
      { error: "Failed to fetch amendments" },
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
    const { amendmentId, action } = body;

    if (!amendmentId || !action) {
      return NextResponse.json(
        { error: "Missing amendmentId or action" },
        { status: 400 }
      );
    }

    let newStatus: AmendmentStatus;

    switch (action) {
      case "approve":
        newStatus = "accepted";
        break;
      case "reject":
        newStatus = "rejected";
        break;
      case "push":
        newStatus = "client_review";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update the amendment status
    await db
      .update(amendments)
      .set({ status: newStatus })
      .where(eq(amendments.id, amendmentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating amendment:", error);
    return NextResponse.json(
      { error: "Failed to update amendment" },
      { status: 500 }
    );
  }
}
