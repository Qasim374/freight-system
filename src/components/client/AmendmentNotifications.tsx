"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AmendmentResponseModal from "./AmendmentResponseModal";

interface AmendmentNotification {
  id: number;
  shipmentId: string;
  reason: string;
  extraCost: number;
  delayDays: number;
  status: string;
  createdAt: string;
}

export default function AmendmentNotifications() {
  const { data: session } = useSession();
  const [pendingAmendments, setPendingAmendments] = useState<
    AmendmentNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmendmentId, setSelectedAmendmentId] = useState<number | null>(
    null
  );
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPendingAmendments();
    }
  }, [session]);

  const fetchPendingAmendments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/client/amendments/pending", {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingAmendments(data.amendments || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending amendments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAmendmentResponse = (amendmentId: number) => {
    setSelectedAmendmentId(amendmentId);
    setShowResponseModal(true);
  };

  const handleResponseSuccess = () => {
    setShowResponseModal(false);
    setSelectedAmendmentId(null);
    fetchPendingAmendments(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (pendingAmendments.length === 0) {
    return null; // Don't show anything if no pending amendments
  }

  return (
    <div className="mb-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Amendment Response Required
              </h3>
              <div className="mt-1 text-sm text-orange-700">
                You have {pendingAmendments.length} pending amendment
                {pendingAmendments.length > 1 ? "s" : ""} that require
                {pendingAmendments.length > 1 ? "" : "s"} your attention.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {pendingAmendments.map((amendment) => (
            <div
              key={amendment.id}
              className="bg-white rounded-md p-3 border border-orange-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Shipment #{amendment.shipmentId.substring(0, 8)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {amendment.reason.substring(0, 100)}
                    {amendment.reason.length > 100 && "..."}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Extra Cost: ${amendment.extraCost.toFixed(2)} • Delay:{" "}
                    {amendment.delayDays} days
                  </div>
                </div>
                <button
                  onClick={() => handleAmendmentResponse(amendment.id)}
                  className="ml-4 px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Respond
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amendment Response Modal */}
      {selectedAmendmentId && (
        <AmendmentResponseModal
          amendmentId={selectedAmendmentId}
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          onSuccess={handleResponseSuccess}
        />
      )}
    </div>
  );
}
