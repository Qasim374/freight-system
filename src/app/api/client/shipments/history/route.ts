import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { shipments, auditLogs, users } from "@/lib/schema";
import { isClientRole } from "@/lib/auth-utils";

// GET - Get shipment history with audit logs
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId || !userRole || !isClientRole(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all client shipments
    const clientShipments = await db
      .select({
        id: shipments.id,
        status: shipments.status,
        commodity: shipments.commodity,
        containerType: shipments.containerType,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.clientId, parseInt(userId)))
      .orderBy(desc(shipments.createdAt));

    // Get audit logs for each shipment
    const shipmentsWithHistory = await Promise.all(
      clientShipments.map(async (shipment) => {
        const logs = await db
          .select({
            id: auditLogs.id,
            action: auditLogs.action,
            details: auditLogs.details,
            timestamp: auditLogs.timestamp,
            actorId: auditLogs.actorId,
          })
          .from(auditLogs)
          .where(eq(auditLogs.shipmentId, shipment.id))
          .orderBy(desc(auditLogs.timestamp));

        // Get actor names for logs
        const logsWithActors = await Promise.all(
          logs.map(async (log) => {
            const actor = await db
              .select({
                email: users.email,
                company: users.company,
              })
              .from(users)
              .where(eq(users.id, log.actorId))
              .limit(1);

            return {
              ...log,
              actorName: actor[0]?.company || actor[0]?.email || "System",
            };
          })
        );

        return {
          ...shipment,
          auditLogs: logsWithActors,
        };
      })
    );

    return NextResponse.json({
      shipments: shipmentsWithHistory,
    });
  } catch (error) {
    console.error("Shipment history API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
