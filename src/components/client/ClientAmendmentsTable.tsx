"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AmendmentResponseModal from "./AmendmentResponseModal";

interface Amendment {
  id: number;
  shipmentId: number;
  reason: string;
  extraCost: number | null;
  markupAmount: number | null;
  delayDays: number | null;
  status: string;
  initiatedBy: string;
  approvedBy: string | null;
  clientResponseAt: string | null;
  adminReviewAt: string | null;
  vendorReplyAt: string | null;
  createdAt: string;
  commodity?: string;
  containerType?: string;
  mode?: string;
  collectionAddress?: string;
  shipmentDate?: string;
}

export default function ClientAmendmentsTable() {
  const { data: session } = useSession();
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAmendmentId, setSelectedAmendmentId] = useState<number | null>(
    null
  );
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAmendments();
    }
  }, [session, selectedStatus]);

  const fetchAmendments = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        selectedStatus === "all"
          ? "/api/client/amendments"
          : `/api/client/amendments?status=${selectedStatus}`;

      const response = await fetch(url, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAmendments(data.amendments || []);
      } else {
        setError("Failed to fetch amendments");
      }
    } catch (error) {
      console.error("Failed to fetch amendments:", error);
      setError("An error occurred while loading amendments");
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
    fetchAmendments(); // Refresh the list
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      case "vendor_replied":
        return "bg-blue-100 text-blue-800";
      case "admin_review":
        return "bg-purple-100 text-purple-800";
      case "client_review":
        return "bg-orange-100 text-orange-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "requested":
        return "Requested";
      case "vendor_replied":
        return "Vendor Replied";
      case "admin_review":
        return "Admin Review";
      case "client_review":
        return "Client Review";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchAmendments}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Filter */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-4">
          {[
            "all",
            "requested",
            "vendor_replied",
            "admin_review",
            "client_review",
            "accepted",
            "rejected",
          ].map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                selectedStatus === status
                  ? "bg-gray-700 text-white shadow-sm"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900"
              }`}
              onClick={() => setSelectedStatus(status)}
            >
              {status === "all" ? "All" : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipment ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipment Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extra Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delay (Days)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {amendments.map((amendment) => (
              <tr key={amendment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{amendment.shipmentId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {amendment.commodity} ({amendment.containerType})
                  <br />
                  <span className="text-xs text-gray-400">
                    {amendment.mode}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {amendment.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {amendment.extraCost
                    ? `$${amendment.extraCost.toFixed(2)}`
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {amendment.delayDays || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      amendment.status
                    )}`}
                  >
                    {getStatusLabel(amendment.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {amendment.status === "client_review" && (
                    <button
                      onClick={() => handleAmendmentResponse(amendment.id)}
                      className="text-orange-600 hover:text-orange-900 font-medium"
                    >
                      Respond
                    </button>
                  )}
                  {amendment.status === "accepted" && (
                    <span className="text-green-600 font-medium">
                      ✓ Accepted
                    </span>
                  )}
                  {amendment.status === "rejected" && (
                    <span className="text-red-600 font-medium">✗ Rejected</span>
                  )}
                  {["requested", "vendor_replied", "admin_review"].includes(
                    amendment.status
                  ) && <span className="text-gray-500">Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {amendments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No amendments found for this status
          </div>
        )}
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
