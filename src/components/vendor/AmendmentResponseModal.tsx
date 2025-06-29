"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface AmendmentRequest {
  id: string;
  shipmentId: string;
  requestType: string;
  description: string;
  status: string;
  createdAt: string;
  extraCost?: string;
  delayDays?: number;
  reason?: string;
}

interface AmendmentResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  amendment: AmendmentRequest;
  onAmendmentResponded: () => void;
}

export default function AmendmentResponseModal({
  isOpen,
  onClose,
  amendment,
  onAmendmentResponded,
}: AmendmentResponseModalProps) {
  const { data: session } = useSession();
  const [response, setResponse] = useState<"approve" | "reject">("approve");
  const [formData, setFormData] = useState({
    extraCost: "",
    delayDays: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const responseData = {
        amendmentId: amendment.id,
        response,
        extraCost:
          response === "approve"
            ? parseFloat(formData.extraCost) || 0
            : undefined,
        delayDays:
          response === "approve"
            ? parseInt(formData.delayDays) || 0
            : undefined,
        reason: formData.reason,
      };

      const apiResponse = await fetch("/api/vendor/respond-amendment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify(responseData),
      });

      if (apiResponse.ok) {
        onAmendmentResponded();
      } else {
        const data = await apiResponse.json();
        setError(data.error || "Failed to submit response");
      }
    } catch (error) {
      console.error("Error responding to amendment:", error);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
              Respond to Amendment Request
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

          {/* Amendment Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Amendment Details
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipment ID
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  #{amendment.shipmentId.toString().substring(0, 8)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Request Type
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {amendment.requestType.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {amendment.description}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Requested On
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(amendment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="response"
                    value="approve"
                    checked={response === "approve"}
                    onChange={(e) =>
                      setResponse(e.target.value as "approve" | "reject")
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Approve with Changes
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="response"
                    value="reject"
                    checked={response === "reject"}
                    onChange={(e) =>
                      setResponse(e.target.value as "approve" | "reject")
                    }
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Reject</span>
                </label>
              </div>
            </div>

            {response === "approve" && (
              <>
                <div>
                  <label
                    htmlFor="extraCost"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Extra Cost (USD)
                  </label>
                  <input
                    type="number"
                    id="extraCost"
                    name="extraCost"
                    step="0.01"
                    min="0"
                    value={formData.extraCost}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter additional cost if any"
                  />
                </div>

                <div>
                  <label
                    htmlFor="delayDays"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Delay in Days
                  </label>
                  <input
                    type="number"
                    id="delayDays"
                    name="delayDays"
                    min="0"
                    value={formData.delayDays}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter delay in days if any"
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                {response === "approve"
                  ? "Additional Notes"
                  : "Reason for Rejection"}{" "}
                *
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                required
                value={formData.reason}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  response === "approve"
                    ? "Any additional notes or clarifications"
                    : "Please provide a reason for rejecting this amendment"
                }
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
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  response === "approve"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                }`}
              >
                {loading
                  ? "Submitting..."
                  : response === "approve"
                  ? "Approve with Changes"
                  : "Reject Amendment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
