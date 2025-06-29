"use client";

import { useState, useEffect } from "react";

interface Quote {
  id: number;
  client: string;
  containerType: string;
  commodity: string;
  mode: string;
  numContainers: number;
  weightPerContainer: number;
  shipmentDate: string;
  collectionAddress: string;
  status: string;
  finalPrice: number;
  selectedVendorId?: number;
  createdAt: string;
}

export default function QuoteTable() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("awaiting_bids");

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/quotes?status=${selectedStatus}`
        );
        const data = await response.json();

        if (response.ok) {
          setQuotes(data);
        } else {
          setError(data.error || "Failed to fetch quotes");
        }
      } catch (error) {
        console.error("Error fetching quotes:", error);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_bids":
        return "bg-yellow-100 text-yellow-800";
      case "bids_received":
        return "bg-blue-100 text-blue-800";
      case "client_review":
        return "bg-purple-100 text-purple-800";
      case "booked":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "awaiting_bids":
        return "Awaiting Bids";
      case "bids_received":
        return "Bids Received";
      case "client_review":
        return "Client Review";
      case "booked":
        return "Booked";
      default:
        return status;
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
      {/* Header with Status Tabs */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex space-x-4">
          {["awaiting_bids", "bids_received", "client_review", "booked"].map(
            (status) => (
              <button
                key={status}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  selectedStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                {getStatusText(status)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {quotes.map((quote) => (
            <li key={quote.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Quote #{quote.id.toString().substring(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Client: {quote.client}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        quote.status
                      )}`}
                    >
                      {getStatusText(quote.status)}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">
                        Container:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.containerType}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Commodity:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.commodity}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Mode:</span>
                      <span className="ml-1 text-gray-900">{quote.mode}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Containers:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.numContainers}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">
                        Weight/Container:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.weightPerContainer} kg
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Shipment Date:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.shipmentDate !== "N/A" ? new Date(quote.shipmentDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Final Price:
                      </span>
                      <span className="ml-1 text-gray-900">
                        ${quote.finalPrice?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="font-medium text-gray-500">
                      Collection Address:
                    </span>
                    <span className="ml-1 text-gray-900">
                      {quote.collectionAddress}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 