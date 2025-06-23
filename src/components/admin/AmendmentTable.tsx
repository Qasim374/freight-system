"use client";

import { useState, useEffect } from "react";

interface Amendment {
  id: number;
  shipmentId: string;
  reason: string;
  extraCost: number;
  delayDays: number;
  status: string;
  createdAt: string;
  client: string;
  containerType: string;
  commodity: string;
}

export default function AmendmentTable() {
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("admin_review");
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchAmendments = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/amendments?status=${selectedStatus}`
        );
        const data = await response.json();

        if (response.ok) {
          setAmendments(data);
        } else {
          setError(data.error || "Failed to fetch amendments");
        }
      } catch (error) {
        console.error("Error fetching amendments:", error);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchAmendments();
  }, [selectedStatus]);

  const handleAction = async (amendmentId: number, action: string) => {
    try {
      const response = await fetch("/api/admin/amendments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amendmentId, action }),
      });

      if (response.ok) {
        // Refresh amendments
        const refreshResponse = await fetch(
          `/api/admin/amendments?status=${selectedStatus}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setAmendments(refreshData);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to update amendment:", errorData.error);
      }
    } catch (error) {
      console.error("Error updating amendment:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      case "vendor_replied":
        return "bg-blue-100 text-blue-800";
      case "admin_review":
        return "bg-orange-100 text-orange-800";
      case "client_review":
        return "bg-purple-100 text-purple-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex space-x-4">
          {["admin_review", "client_review", "accepted", "rejected"].map(
            (status) => (
              <button
                key={status}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  selectedStatus === status
                    ? "bg-gray-700 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                {status.replace(/_/g, " ").toUpperCase()}
              </button>
            )
          )}
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shipment ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Extra Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Delay Days
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {amendments.map((amendment) => (
            <tr key={amendment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {amendment.shipmentId.substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {amendment.client}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {amendment.reason}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {amendment.extraCost > 0
                  ? `$${amendment.extraCost.toFixed(2)}`
                  : "No cost"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {amendment.delayDays > 0
                  ? `${amendment.delayDays} days`
                  : "No delay"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    amendment.status
                  )}`}
                >
                  {amendment.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(amendment.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {amendment.status === "admin_review" && (
                  <>
                    <button
                      onClick={() => handleAction(amendment.id, "push")}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Push to Client
                    </button>
                    <button
                      onClick={() => handleAction(amendment.id, "approve")}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(amendment.id, "reject")}
                      className="text-red-600 hover:text-red-900 mr-3"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedAmendment(amendment);
                    setShowDetailsModal(true);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Details
                </button>
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

      {/* Amendment Details Modal */}
      {showDetailsModal && selectedAmendment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Amendment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Shipment ID
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAmendment.shipmentId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAmendment.client}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Container Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAmendment.containerType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Commodity
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAmendment.commodity}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAmendment.reason}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Extra Cost
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAmendment.extraCost > 0
                      ? `$${selectedAmendment.extraCost.toFixed(2)}`
                      : "No additional cost"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delay Days
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedAmendment.delayDays > 0
                      ? `${selectedAmendment.delayDays} days`
                      : "No delay"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedAmendment.status
                    )}`}
                  >
                    {selectedAmendment.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
