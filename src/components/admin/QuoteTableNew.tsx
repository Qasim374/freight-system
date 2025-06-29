"use client";

import { useState, useEffect } from "react";

interface Quote {
  id: number;
  client: string;
  containerType: string;
  commodity: string;
  origin: string;
  destination: string;
  cost: number;
  sailingDate: string;
  carrierName: string;
  status: string;
  vendorId: number;
  vendorName: string;
  submittedAt: string;
  isWinner: boolean;
}

export default function QuoteTable() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [markup, setMarkup] = useState(14); // Default 14% markup
  const [showMarkupModal, setShowMarkupModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const handleApprove = async (quoteId: number) => {
    try {
      const response = await fetch("/api/admin/quotes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
          action: "approve",
          markup: markup / 100,
        }),
      });

      if (response.ok) {
        // Refresh quotes
        const refreshResponse = await fetch(
          `/api/admin/quotes?status=${selectedStatus}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setQuotes(refreshData);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to approve quote:", errorData.error);
      }
    } catch (error) {
      console.error("Error approving quote:", error);
    }
  };

  const handleOverride = async (quoteId: number) => {
    setSelectedQuote(quotes.find((q) => q.id === quoteId) || null);
    setShowMarkupModal(true);
  };

  const handleMarkupSubmit = async () => {
    if (!selectedQuote) return;

    try {
      const response = await fetch("/api/admin/quotes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId: selectedQuote.id,
          action: "override",
          markup: markup / 100,
        }),
      });

      if (response.ok) {
        setShowMarkupModal(false);
        setSelectedQuote(null);
        // Refresh quotes
        const refreshResponse = await fetch(
          `/api/admin/quotes?status=${selectedStatus}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setQuotes(refreshData);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to override quote:", errorData.error);
      }
    } catch (error) {
      console.error("Error overriding quote:", error);
    }
  };

  const handleReject = async (quoteId: number) => {
    try {
      const response = await fetch("/api/admin/quotes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
          action: "reject",
        }),
      });

      if (response.ok) {
        // Refresh quotes
        const refreshResponse = await fetch(
          `/api/admin/quotes?status=${selectedStatus}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setQuotes(refreshData);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to reject quote:", errorData.error);
      }
    } catch (error) {
      console.error("Error rejecting quote:", error);
    }
  };

  const calculateClientPrice = (cost: number) => {
    return cost * (1 + markup / 100);
  };

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "booked":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
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
      {/* Header with Status Tabs and Markup Control */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            {["pending", "approved", "rejected", "booked"].map((status) => (
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
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Default Markup: {markup}%
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={markup}
              onChange={(e) => setMarkup(Number(e.target.value))}
              className="w-24"
            />
          </div>
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
                      <span className="font-medium text-gray-500">Origin:</span>
                      <span className="ml-1 text-gray-900">{quote.origin}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Destination:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.destination}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Cost:</span>
                      <span className="ml-1 text-gray-900">
                        ${quote.cost.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Sailing Date:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.sailingDate !== "N/A"
                          ? new Date(quote.sailingDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Carrier:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {quote.carrierName}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="font-medium text-gray-500">Vendor:</span>
                    <span className="ml-1 text-gray-900">
                      {quote.vendorName}
                    </span>
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => handleViewDetails(quote)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </button>

                  {quote.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(quote.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleOverride(quote.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Override Markup
                      </button>
                      <button
                        onClick={() => handleReject(quote.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Markup Override Modal */}
      {showMarkupModal && selectedQuote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Override Markup for Quote #{selectedQuote.id}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup Percentage
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={markup}
                  onChange={(e) => setMarkup(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Client Price: $
                  {calculateClientPrice(selectedQuote.cost).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMarkupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkupSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Apply Markup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Details Modal */}
      {showDetailsModal && selectedQuote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quote Details #{selectedQuote.id}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Client:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.client}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">
                    Container Type:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.containerType}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Commodity:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.commodity}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Origin:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.origin}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">
                    Destination:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.destination}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Cost:</span>
                  <span className="ml-2 text-gray-900">
                    ${selectedQuote.cost.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">
                    Sailing Date:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.sailingDate !== "N/A"
                      ? new Date(selectedQuote.sailingDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Carrier:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.carrierName}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Vendor:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedQuote.vendorName}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900">
                    {getStatusText(selectedQuote.status)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Submitted:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(selectedQuote.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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
