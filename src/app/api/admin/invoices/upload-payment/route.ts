import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, testConnection } from "@/lib/db";
import { eq } from "drizzle-orm";
import { invoices } from "@/lib/schema";

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const paymentProof = formData.get("paymentProof") as File;
    const invoiceId = formData.get("invoiceId") as string;

    if (!paymentProof || !invoiceId) {
      return NextResponse.json(
        { error: "Missing payment proof or invoice ID" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(paymentProof.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (paymentProof.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // In a real application, you would upload the file to a cloud storage service
    // For now, we'll simulate by creating a file URL
    const fileName = `payment_proof_${invoiceId}_${Date.now()}.${paymentProof.name
      .split(".")
      .pop()}`;
    const fileUrl = `/uploads/payments/${fileName}`;

    // Update the invoice with payment proof and status
    await db
      .update(invoices)
      .set({
        status: "awaiting_verification",
        // In a real app, you'd store the file URL here
        // For now, we'll use a placeholder
      })
      .where(eq(invoices.id, parseInt(invoiceId)));

    return NextResponse.json({
      success: true,
      message: "Payment proof uploaded successfully",
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    return NextResponse.json(
      { error: "Failed to upload payment proof" },
      { status: 500 }
    );
  }
}
