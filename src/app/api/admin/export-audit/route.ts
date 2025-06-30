import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  shipmentLogs,
  shipments,
  quotes,
  users,
  quoteBids,
  amendments,
} from "@/lib/schema";

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
    const shipmentId = searchParams.get("shipmentId");
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Shipment ID is required" },
        { status: 400 }
      );
    }

    // Get shipment details
    const shipmentData = await db
      .select({
        id: shipments.id,
        quoteId: shipments.quoteId,
        clientId: shipments.clientId,
        vendorId: shipments.vendorId,
        shipmentStatus: shipments.shipmentStatus,
        trackingStatus: shipments.trackingStatus,
        createdAt: shipments.createdAt,
        clientName: users.company,
        clientEmail: users.email,
      })
      .from(shipments)
      .leftJoin(users, eq(shipments.clientId, users.id))
      .where(eq(shipments.id, parseInt(shipmentId)))
      .limit(1);

    if (shipmentData.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    const shipment = shipmentData[0];

    // Get all logs for this shipment
    const logs = await db
      .select({
        id: shipmentLogs.id,
        actor: shipmentLogs.actor,
        action: shipmentLogs.action,
        details: shipmentLogs.details,
        timestamp: shipmentLogs.timestamp,
      })
      .from(shipmentLogs)
      .where(eq(shipmentLogs.shipmentId, parseInt(shipmentId)))
      .orderBy(asc(shipmentLogs.timestamp));

    // Get quote details
    const quoteData = await db
      .select({
        id: quotes.id,
        mode: quotes.mode,
        containerType: quotes.containerType,
        commodity: quotes.commodity,
        numContainers: quotes.numContainers,
        weightPerContainer: quotes.weightPerContainer,
        finalPrice: quotes.finalPrice,
        status: quotes.status,
        createdAt: quotes.createdAt,
      })
      .from(quotes)
      .where(eq(quotes.id, shipment.quoteId))
      .limit(1);

    // Get vendor bids
    const bids = await db
      .select({
        id: quoteBids.id,
        vendorId: quoteBids.vendorId,
        costUsd: quoteBids.costUsd,
        sailingDate: quoteBids.sailingDate,
        carrierName: quoteBids.carrierName,
        status: quoteBids.status,
        createdAt: quoteBids.createdAt,
        vendorName: users.company,
      })
      .from(quoteBids)
      .leftJoin(users, eq(quoteBids.vendorId, users.id))
      .where(eq(quoteBids.quoteId, shipment.quoteId))
      .orderBy(asc(quoteBids.costUsd));

    // Get amendments
    const amendmentsData = await db
      .select({
        id: amendments.id,
        initiatedBy: amendments.initiatedBy,
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
      .where(eq(billsOfLading.shipmentId, parseInt(shipmentId)))
      .orderBy(asc(amendments.createdAt));

    // Compile audit data
    const auditData = {
      shipment: {
        id: shipment.id,
        clientName: shipment.clientName,
        clientEmail: shipment.clientEmail,
        status: shipment.shipmentStatus,
        trackingStatus: shipment.trackingStatus,
        createdAt: shipment.createdAt.toISOString(),
      },
      quote: quoteData[0]
        ? {
            id: quoteData[0].id,
            mode: quoteData[0].mode,
            containerType: quoteData[0].containerType,
            commodity: quoteData[0].commodity,
            numContainers: quoteData[0].numContainers,
            weightPerContainer: Number(quoteData[0].weightPerContainer),
            finalPrice: Number(quoteData[0].finalPrice),
            status: quoteData[0].status,
            createdAt: quoteData[0].createdAt.toISOString(),
          }
        : null,
      bids: bids.map((bid) => ({
        id: bid.id,
        vendorName: bid.vendorName,
        cost: Number(bid.costUsd),
        sailingDate: bid.sailingDate?.toISOString(),
        carrierName: bid.carrierName,
        status: bid.status,
        submittedAt: bid.createdAt.toISOString(),
      })),
      amendments: amendmentsData.map((amendment) => ({
        id: amendment.id,
        initiatedBy: amendment.initiatedBy,
        reason: amendment.reason,
        extraCost: amendment.extraCost ? Number(amendment.extraCost) : null,
        delayDays: amendment.delayDays,
        status: amendment.status,
        createdAt: amendment.createdAt.toISOString(),
        clientResponseAt: amendment.clientResponseAt?.toISOString() || null,
        adminReviewAt: amendment.adminReviewAt?.toISOString() || null,
      })),
      logs: logs.map((log) => ({
        id: log.id,
        actor: log.actor,
        action: log.action,
        details: log.details,
        timestamp: log.timestamp.toISOString(),
      })),
    };

    if (format === "pdf") {
      // Generate PDF (in a real implementation, you'd use a PDF library)
      return NextResponse.json({
        message: "PDF export not implemented yet",
        data: auditData,
      });
    } else {
      // Generate CSV
      const csvData = generateCSV(auditData);

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit_shipment_${shipmentId}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Export audit error:", error);
    return NextResponse.json(
      { error: "Failed to export audit data" },
      { status: 500 }
    );
  }
}

function generateCSV(auditData: any): string {
  const lines = [];

  // Header
  lines.push("Royal Gulf Freight System - Shipment Audit Report");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Shipment Info
  lines.push("SHIPMENT INFORMATION");
  lines.push("ID,Client,Status,Tracking Status,Created");
  lines.push(
    `${auditData.shipment.id},"${auditData.shipment.clientName}","${auditData.shipment.status}","${auditData.shipment.trackingStatus}","${auditData.shipment.createdAt}"`
  );
  lines.push("");

  // Quote Info
  if (auditData.quote) {
    lines.push("QUOTE INFORMATION");
    lines.push(
      "ID,Mode,Container,Commodity,Containers,Weight,Final Price,Status"
    );
    lines.push(
      `${auditData.quote.id},"${auditData.quote.mode}","${auditData.quote.containerType}","${auditData.quote.commodity}",${auditData.quote.numContainers},${auditData.quote.weightPerContainer},${auditData.quote.finalPrice},"${auditData.quote.status}"`
    );
    lines.push("");
  }

  // Bids
  lines.push("VENDOR BIDS");
  lines.push("Vendor,Cost,Carrier,Sailing Date,Status,Submitted");
  auditData.bids.forEach((bid: any) => {
    lines.push(
      `"${bid.vendorName}",${bid.cost},"${bid.carrierName}","${bid.sailingDate}","${bid.status}","${bid.submittedAt}"`
    );
  });
  lines.push("");

  // Amendments
  if (auditData.amendments.length > 0) {
    lines.push("AMENDMENTS");
    lines.push("ID,Initiated By,Reason,Extra Cost,Delay Days,Status,Created");
    auditData.amendments.forEach((amendment: any) => {
      lines.push(
        `${amendment.id},"${amendment.initiatedBy}","${amendment.reason}",${
          amendment.extraCost || 0
        },${amendment.delayDays || 0},"${amendment.status}","${
          amendment.createdAt
        }"`
      );
    });
    lines.push("");
  }

  // Activity Logs
  lines.push("ACTIVITY LOGS");
  lines.push("Timestamp,Actor,Action,Details");
  auditData.logs.forEach((log: any) => {
    lines.push(
      `"${log.timestamp}","${log.actor}","${log.action}","${log.details}"`
    );
  });

  return lines.join("\n");
}

// Import billsOfLading schema
import { billsOfLading } from "@/lib/schema";
