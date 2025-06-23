"use client";

import { useState, useEffect } from "react";

interface Quote {
  id: number;
  shipmentId: string;
  client: string;
  containerType: string;
  cost: number;
  sailingDate: string;
  carrierName: string;
  status: string;
  vendorId?: number;
  vendorName?: string;
  submittedAt?: string;
  isWinner?: boolean;
}

interface QuoteDetails {
  id: number;
  shipmentId: string;
  client: string;
  containerType: string;
  commodity: string;
  numberOfContainers: number;
  weightPerContainer: number;
  preferredShipmentDate: string;
  collectionAddress: string;
  quotes: Quote[];
}

export default function QuoteTable() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("quote_requested");
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
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
          // Group quotes by shipment
          const groupedQuotes = data.reduce((acc: any, quote: Quote) => {
            if (!acc[quote.shipmentId]) {
              acc[quote.shipmentId] = {
                shipmentId: quote.shipmentId,
                quotes: [],
              };
            }
            acc[quote.shipmentId].quotes.push(quote);
            return acc;
          }, {});
          setQuoteDetails(Object.values(groupedQuotes));
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
        setQuotes(quotes.filter((quote) => quote.id !== quoteId));
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

  const calculateClientPrice = (cost: number) => {
    return cost * (1 + markup / 100);
  };

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
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
            {["quote_requested", "quote_received", "booked"].map((status) => (
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

      {/* Quote Details View */}
      <div className="space-y-6 p-4">
        {quoteDetails.map((shipment) => (
          <div
            key={shipment.shipmentId}
            className="bg-white border rounded-lg overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Shipment {shipment.shipmentId.substring(0, 8)}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {shipment.quotes.length} quotes received
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sailing Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carrier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shipment.quotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className={quote.isWinner ? "bg-green-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quote.vendorName || `Vendor ${quote.vendorId}`}
                        {quote.isWinner && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Winner
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${quote.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${calculateClientPrice(quote.cost).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        $
                        {(
                          calculateClientPrice(quote.cost) - quote.cost
                        ).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(quote.sailingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quote.carrierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!quote.isWinner && (
                          <>
                            <button
                              onClick={() => handleApprove(quote.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Auto-Select
                            </button>
                            <button
                              onClick={() => handleOverride(quote.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Override
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewDetails(quote)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {quotes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No quotes found for this status
        </div>
      )}

      {/* Markup Override Modal */}
      {showMarkupModal && selectedQuote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Override Quote Selection
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Markup (%)
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
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Vendor Cost:</strong> ${selectedQuote.cost.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Client Price:</strong> $
                  {calculateClientPrice(selectedQuote.cost).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Margin:</strong> $
                  {(
                    calculateClientPrice(selectedQuote.cost) -
                    selectedQuote.cost
                  ).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMarkupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkupSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Override & Approve
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
                Quote Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quote ID
                  </label>
                  <p className="text-sm text-gray-900">#{selectedQuote.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Shipment ID
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedQuote.shipmentId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedQuote.client}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedQuote.vendorName ||
                      `Vendor ${selectedQuote.vendorId}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Container Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedQuote.containerType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Cost
                  </label>
                  <p className="text-sm text-gray-900">
                    ${selectedQuote.cost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client Price (with {markup}% markup)
                  </label>
                  <p className="text-sm text-gray-900">
                    ${calculateClientPrice(selectedQuote.cost).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Margin
                  </label>
                  <p className="text-sm text-gray-900">
                    $
                    {(
                      calculateClientPrice(selectedQuote.cost) -
                      selectedQuote.cost
                    ).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sailing Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedQuote.sailingDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carrier
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedQuote.carrierName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Submitted
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedQuote.submittedAt
                      ? new Date(selectedQuote.submittedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedQuote.isWinner
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedQuote.isWinner
                      ? "WINNER"
                      : selectedQuote.status.replace(/_/g, " ").toUpperCase()}
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
