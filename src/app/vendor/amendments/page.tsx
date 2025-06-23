"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import VendorAmendmentTable from "@/components/vendor/VendorAmendmentTable";
import AmendmentResponseModal from "@/components/vendor/AmendmentResponseModal";

interface AmendmentRequest {
  id: string;
  shipmentId: string;
  requestType: string;
  description: string;
  status: string;
  createdAt: string;
  extraCost?: string;
  delayDays?: number;
  reason?: string;
}

export default function VendorAmendmentsPage() {
  const { data: session } = useSession();
  const [amendments, setAmendments] = useState<AmendmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmendment, setSelectedAmendment] =
    useState<AmendmentRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAmendments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/vendor/amendments", {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAmendments(data.amendments || []);
        }
      } catch (error) {
        console.error("Error fetching amendments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAmendments();
    }
  }, [session]);

  const handleRespondToAmendment = (amendment: AmendmentRequest) => {
    setSelectedAmendment(amendment);
    setIsModalOpen(true);
  };

  const handleAmendmentResponded = () => {
    setIsModalOpen(false);
    setSelectedAmendment(null);
    // Refresh the amendments
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Amendment Requests
          </h1>
          <p className="text-gray-600 mt-2">
            Review and respond to amendment requests from admin
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Pending Amendments (
              {amendments.filter((a) => a.status === "pending").length})
            </h2>
          </div>

          <VendorAmendmentTable
            amendments={amendments}
            onRespondToAmendment={handleRespondToAmendment}
          />
        </div>

        {selectedAmendment && (
          <AmendmentResponseModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            amendment={selectedAmendment}
            onAmendmentResponded={handleAmendmentResponded}
          />
        )}
      </div>
    </div>
  );
}
