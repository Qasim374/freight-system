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
}

export default function AmendmentTable() {
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("requested");

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

  useEffect(() => {
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
        // Refresh data
        fetchAmendments();
      } else {
        const errorData = await response.json();
        console.error("Failed to process amendment:", errorData.error);
      }
    } catch (error) {
      console.error("Error processing amendment:", error);
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
      <div className="p-4 border-b">
        <div className="flex space-x-4">
          {["requested", "vendor_replied", "admin_review", "client_review"].map(
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
                {amendment.shipmentId.substring(0, 8)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {amendment.reason.substring(0, 50)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                $
                {typeof amendment.extraCost === "number"
                  ? amendment.extraCost.toFixed(2)
                  : "0.00"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {amendment.delayDays}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${
                    amendment.status === "requested"
                      ? "bg-yellow-100 text-yellow-800"
                      : amendment.status === "vendor_replied"
                      ? "bg-blue-100 text-blue-800"
                      : amendment.status === "admin_review"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {amendment.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {amendment.status === "vendor_replied" && (
                  <>
                    <button
                      onClick={() => handleAction(amendment.id, "approve")}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(amendment.id, "reject")}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </>
                )}
                {amendment.status === "admin_review" && (
                  <button
                    onClick={() => handleAction(amendment.id, "push")}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Push to Client
                  </button>
                )}
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
  );
}
