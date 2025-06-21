import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sql, count, eq, inArray } from "drizzle-orm";
import { users, quotes } from "@/lib/schema";

export async function GET() {
  try {
    // Define vendor roles with correct literal types
    const vendorRoles = [
      "vendor_admin",
      "pricing_agent",
      "bl_manager_vendor",
      "accounts_vendor",
      "vendor_manager",
    ] as const;

    // Vendor win rates
    const vendorWinRates = await db
      .select({
        vendorId: users.id,
        company: users.company,
        quoteCount: count(quotes.id),
        winRate: sql<number>`(COUNT(CASE WHEN ${quotes.isWinner} THEN 1 END) * 100.0 / COUNT(*))`,
      })
      .from(users)
      .leftJoin(quotes, eq(users.id, quotes.vendorId))
      .where(inArray(users.role, vendorRoles))
      .groupBy(users.id, users.company)
      .having(sql`${count(quotes.id)} > 0`)
      .orderBy(
        sql`(COUNT(CASE WHEN ${quotes.isWinner} THEN 1 END) * 100.0 / COUNT(*)) DESC`
      )
      .limit(10);

    // Top vendors by win rate
    const topVendors = await db
      .select({
        vendorId: users.id,
        company: users.company,
        quoteCount: count(quotes.id),
        winRate: sql<number>`(COUNT(CASE WHEN ${quotes.isWinner} THEN 1 END) * 100.0 / COUNT(*))`,
        avgBidGap: sql<number>`AVG(${quotes.cost})`,
      })
      .from(users)
      .innerJoin(quotes, eq(users.id, quotes.vendorId))
      .where(inArray(users.role, vendorRoles))
      .groupBy(users.id, users.company)
      .having(sql`${count(quotes.id)} > 0`)
      .orderBy(
        sql`(COUNT(CASE WHEN ${quotes.isWinner} THEN 1 END) * 100.0 / COUNT(*)) DESC`
      )
      .limit(5);

    return NextResponse.json({
      vendorWinRates: vendorWinRates.map((v) => ({
        company: v.company || "Unknown Vendor",
        winRate: Number(v.winRate) || 0,
      })),
      topVendors: topVendors.map((v) => ({
        id: v.vendorId,
        company: v.company || "Unknown Vendor",
        quoteCount: Number(v.quoteCount),
        winRate: Number(v.winRate) || 0,
        avgBidGap: v.avgBidGap ? Number(v.avgBidGap) : undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
