"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import QuoteResultScreen from "@/components/client/QuoteResultScreen";

export default function QuoteResultPage() {
  const { data: session } = useSession();
  const params = useParams();

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuoteResultScreen shipmentId={params.id as string} />
      </div>
    </div>
  );
}
