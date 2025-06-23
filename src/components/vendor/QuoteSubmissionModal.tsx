"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface QuoteRequest {
  id: string;
  containerType: string;
  commodity: string;
  origin: string;
  destination: string;
  status: string;
  createdAt: string;
  clientId: number;
  clientName?: string;
}

interface QuoteSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuoteRequest;
  onQuoteSubmitted: () => void;
}

export default function QuoteSubmissionModal({
  isOpen,
  onClose,
  request,
  onQuoteSubmitted,
}: QuoteSubmissionModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    cost: "",
    sailingDate: "",
    carrierName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vendor/submit-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({
          shipmentId: request.id,
          cost: parseFloat(formData.cost),
          sailingDate: formData.sailingDate,
          carrierName: formData.carrierName,
        }),
      });

      if (response.ok) {
        onQuoteSubmitted();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit quote");
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Submit Quote for Shipment #{request.id.substring(0, 8)}
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

          {/* Shipment Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Shipment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Container Type
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {request.containerType || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Commodity
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {request.commodity || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Origin
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {request.origin || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Destination
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {request.destination || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-gray-700"
              >
                Cost (USD) *
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                step="0.01"
                min="0"
                required
                value={formData.cost}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter cost in USD"
              />
            </div>

            <div>
              <label
                htmlFor="sailingDate"
                className="block text-sm font-medium text-gray-700"
              >
                Sailing Date *
              </label>
              <input
                type="date"
                id="sailingDate"
                name="sailingDate"
                required
                value={formData.sailingDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="carrierName"
                className="block text-sm font-medium text-gray-700"
              >
                Carrier Name *
              </label>
              <input
                type="text"
                id="carrierName"
                name="carrierName"
                required
                value={formData.carrierName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter carrier name"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Quote"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
