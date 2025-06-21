import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { amendments, shipments } from "@/lib/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "requested";

  try {
    const amendmentData = await db
      .select()
      .from(amendments)
      .innerJoin(shipments, eq(amendments.shipmentId, shipments.id))
      .where(eq(amendments.status, status));

    return NextResponse.json(
      amendmentData.map((a) => ({
        id: a.amendments.id,
        shipmentId: a.amendments.shipmentId,
        reason: a.amendments.reason,
        extraCost: a.amendments.extraCost,
        delayDays: a.amendments.delayDays,
        status: a.amendments.status,
        createdAt: a.amendments.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching amendments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { amendmentId, action } = await request.json();

    if (action === "approve") {
      await db
        .update(amendments)
        .set({ status: "admin_review" })
        .where(eq(amendments.id, amendmentId));

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      await db
        .update(amendments)
        .set({ status: "rejected" })
        .where(eq(amendments.id, amendmentId));

      return NextResponse.json({ success: true });
    }

    if (action === "push") {
      await db
        .update(amendments)
        .set({ status: "client_review" })
        .where(eq(amendments.id, amendmentId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating amendment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
