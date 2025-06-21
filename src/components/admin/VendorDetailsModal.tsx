"use client";

import { useState, useEffect } from "react";

interface VendorDetails {
  id: number;
  company: string;
  email: string;
  quoteCount: number;
  winRate: number;
  avgBidGap?: number;
  totalRevenue?: number;
  recentQuotes: Array<{
    id: number;
    shipmentId: string;
    cost: number;
    sailingDate: string;
    carrierName: string;
    isWinner: boolean;
    submittedAt: string;
  }>;
}

interface VendorDetailsModalProps {
  vendorId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorDetailsModal({
  vendorId,
  isOpen,
  onClose,
}: VendorDetailsModalProps) {
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && vendorId) {
      fetchVendorDetails();
    }
  }, [isOpen, vendorId]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/vendors/${vendorId}`);
      const data = await response.json();

      if (response.ok) {
        setVendorDetails(data);
      } else {
        setError(data.error || "Failed to fetch vendor details");
      }
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Vendor Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-800"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
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
          )}

          {vendorDetails && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {vendorDetails.company}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {vendorDetails.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Performance Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {vendorDetails.quoteCount}
                    </div>
                    <div className="text-sm text-gray-600">Total Quotes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {vendorDetails.winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {vendorDetails.avgBidGap?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Bid Gap</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ${vendorDetails.totalRevenue?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                </div>
              </div>

              {/* Recent Quotes */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Recent Quotes
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Shipment ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Cost
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Carrier
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorDetails.recentQuotes.map((quote) => (
                        <tr key={quote.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {quote.shipmentId.substring(0, 8)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            ${quote.cost.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {quote.carrierName}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                quote.isWinner
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {quote.isWinner ? "Winner" : "Submitted"}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(quote.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
