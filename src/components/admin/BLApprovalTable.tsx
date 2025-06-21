"use client";

import { useState, useEffect } from "react";

interface BillOfLading {
  id: number;
  shipmentId: string;
  version: string;
  fileUrl: string;
  approved: boolean;
  uploadedAt: string;
  client: string;
  containerType: string;
  commodity: string;
}

export default function BLApprovalTable() {
  const [bls, setBLs] = useState<BillOfLading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBLs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bl-approvals");
      const data = await response.json();

      if (response.ok) {
        setBLs(data);
      } else {
        setError(data.error || "Failed to fetch BLs");
      }
    } catch (error) {
      console.error("Error fetching BLs:", error);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBLs();
  }, []);

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
        // Refresh data
        fetchBLs();
      } else {
        const errorData = await response.json();
        console.error("Failed to approve BL:", errorData.error);
      }
    } catch (error) {
      console.error("Error approving BL:", error);
    }
  };

  const handleView = (fileUrl: string) => {
    // Open file in new tab for viewing
    window.open(fileUrl, "_blank");
  };

  const handleDownload = async (blId: number, fileName: string) => {
    try {
      // Use the secure download API endpoint
      const response = await fetch(`/api/admin/download-bl?blId=${blId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download file");
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(
        "Failed to download file: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
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
              Container
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Version
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded At
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
          {bls.map((bl) => (
            <tr key={bl.id}>
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
                {bl.version.toUpperCase()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(bl.uploadedAt).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${
                    bl.approved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {bl.approved ? "APPROVED" : "PENDING"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {!bl.approved && (
                  <>
                    <button
                      onClick={() => handleApprove(bl.id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleView(bl.fileUrl)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                  </>
                )}
                {bl.approved && (
                  <>
                    <button
                      onClick={() => handleView(bl.fileUrl)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(
                          bl.id,
                          `BL-${bl.shipmentId}-${bl.version}.pdf`
                        )
                      }
                      className="text-green-600 hover:text-green-900"
                    >
                      Download
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {bls.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No bills of lading found
        </div>
      )}
    </div>
  );
}
