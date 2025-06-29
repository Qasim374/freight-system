import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq, and, count, avg, sql, desc } from "drizzle-orm";
import { users, quoteBids, quotes } from "@/lib/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const vendorId = parseInt(params.id);
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
    }

    // Get vendor basic info and stats
    const vendorStats = await db
      .select({
        id: users.id,
        company: users.company,
        email: users.email,
        quoteCount: count(quoteBids.id),
        winRate: sql<number>`(COUNT(CASE WHEN ${quoteBids.status} = 'selected' THEN 1 END) * 100.0 / COUNT(*))`,
        avgBidGap: avg(quoteBids.costUsd),
        totalRevenue: sql<number>`SUM(CASE WHEN ${quoteBids.status} = 'selected' THEN ${quoteBids.costUsd} ELSE 0 END)`,
      })
      .from(users)
      .leftJoin(quoteBids, eq(users.id, quoteBids.vendorId))
      .where(eq(users.id, vendorId))
      .groupBy(users.id, users.company, users.email);

    if (vendorStats.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const vendor = vendorStats[0];

    // Get recent bids
    const recentBids = await db
      .select({
        id: quoteBids.id,
        quoteId: quoteBids.quoteId,
        costUsd: quoteBids.costUsd,
        sailingDate: quoteBids.sailingDate,
        carrierName: quoteBids.carrierName,
        status: quoteBids.status,
        createdAt: quoteBids.createdAt,
      })
      .from(quoteBids)
      .where(eq(quoteBids.vendorId, vendorId))
      .orderBy(desc(quoteBids.createdAt))
      .limit(10);

    return NextResponse.json({
      id: vendor.id,
      company: vendor.company || "Unknown Vendor",
      email: vendor.email,
      quoteCount: Number(vendor.quoteCount),
      winRate: Number(vendor.winRate) || 0,
      avgBidGap: vendor.avgBidGap ? Number(vendor.avgBidGap) : undefined,
      totalRevenue: Number(vendor.totalRevenue) || 0,
      recentBids: recentBids.map((bid) => ({
        id: bid.id,
        quoteId: bid.quoteId,
        cost: Number(bid.costUsd),
        sailingDate: bid.sailingDate?.toISOString() || "N/A",
        carrierName: bid.carrierName || "N/A",
        status: bid.status,
        submittedAt: bid.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor details" },
      { status: 500 }
    );
  }
}
