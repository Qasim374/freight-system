import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq } from "drizzle-orm";
import { billsOfLading } from "@/lib/schema";
import fs from "fs";
import path from "path";

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
    const blId = searchParams.get("blId");

    if (!blId) {
      return NextResponse.json(
        { error: "Missing blId parameter" },
        { status: 400 }
      );
    }

    // Get the bill of lading record
    const blData = await db
      .select({
        id: billsOfLading.id,
        shipmentId: billsOfLading.shipmentId,
        version: billsOfLading.version,
        fileUrl: billsOfLading.fileUrl,
        approved: billsOfLading.approved,
      })
      .from(billsOfLading)
      .where(eq(billsOfLading.id, parseInt(blId)));

    if (blData.length === 0) {
      return NextResponse.json(
        { error: "Bill of lading not found" },
        { status: 404 }
      );
    }

    const bl = blData[0];

    // Check if BL is approved (optional security check)
    if (!bl.approved) {
      return NextResponse.json(
        { error: "Bill of lading not approved" },
        { status: 403 }
      );
    }

    // Handle different types of file URLs
    let filePath: string;

    if (bl.fileUrl.startsWith("/")) {
      // Relative path - assume it's in the public directory
      filePath = path.join(process.cwd(), "public", bl.fileUrl);
    } else if (bl.fileUrl.startsWith("http")) {
      // External URL - we'll need to fetch it
      const response = await fetch(bl.fileUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "File not accessible" }, { status: 404 });
      }

      const buffer = await response.arrayBuffer();
      const fileName = `BL-${bl.shipmentId}-${bl.version}.pdf`;

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    } else {
      // Assume it's a local file path
      filePath = bl.fileUrl;
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read and serve the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `BL-${bl.shipmentId}-${bl.version}.pdf`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading bill of lading:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
