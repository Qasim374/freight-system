"use client";

import { useState, useEffect } from "react";

interface BillOfLading {
  id: number;
  shipmentId: string;
  version: "draft" | "final";
  fileUrl: string;
  uploadedBy: number;
  approved: boolean;
  uploadedAt: string;
  client: string;
  containerType: string;
  commodity: string;
  vendorName?: string;
}

export default function BLApprovalTable() {
  const [billsOfLading, setBillsOfLading] = useState<BillOfLading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<"draft" | "final">(
    "draft"
  );

  useEffect(() => {
    const fetchBillsOfLading = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/bl-approvals?version=${selectedVersion}`
        );
        const data = await response.json();

        if (response.ok) {
          setBillsOfLading(data);
        } else {
          setError(data.error || "Failed to fetch bills of lading");
        }
      } catch (error) {
        console.error("Error fetching bills of lading:", error);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchBillsOfLading();
  }, [selectedVersion]);

  const handleApprove = async (blId: number) => {
    try {
      const response = await fetch("/api/admin/bl-approvals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blId, action: "approve" }),
      });

      if (response.ok) {
        // Refresh bills of lading
        const refreshResponse = await fetch(
          `/api/admin/bl-approvals?version=${selectedVersion}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setBillsOfLading(refreshData);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to approve BL:", errorData.error);
      }
    } catch (error) {
      console.error("Error approving BL:", error);
    }
  };

  const handleReject = async (blId: number) => {
    try {
      const response = await fetch("/api/admin/bl-approvals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blId, action: "reject" }),
      });

      if (response.ok) {
        // Refresh bills of lading
        const refreshResponse = await fetch(
          `/api/admin/bl-approvals?version=${selectedVersion}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setBillsOfLading(refreshData);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to reject BL:", errorData.error);
      }
    } catch (error) {
      console.error("Error rejecting BL:", error);
    }
  };

  const downloadBL = (fileUrl: string, shipmentId: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `BL_${shipmentId}_${selectedVersion}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            {["draft", "final"].map((version) => (
              <button
                key={version}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  selectedVersion === version
                    ? "bg-gray-700 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                }`}
                onClick={() => setSelectedVersion(version as "draft" | "final")}
              >
                {version.toUpperCase()} BL
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            {billsOfLading.filter((bl) => !bl.approved).length} pending
            approvals
          </div>
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
              Container Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commodity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Version
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
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
          {billsOfLading.map((bl) => (
            <tr key={bl.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {bl.shipmentId.substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {bl.client}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {bl.containerType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {bl.commodity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bl.version === "draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {bl.version.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(bl.uploadedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bl.approved
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {bl.approved ? "APPROVED" : "PENDING"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => downloadBL(bl.fileUrl, bl.shipmentId)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Download
                </button>
                {!bl.approved && (
                  <>
                    <button
                      onClick={() => handleApprove(bl.id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(bl.id)}
                      className="text-red-600 hover:text-red-900 mr-3"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button className="text-gray-600 hover:text-gray-900">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {billsOfLading.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No {selectedVersion} bills of lading found
        </div>
      )}
    </div>
  );
}
