"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface AmendmentResponse {
  id: number;
  shipmentId: string;
  reason: string;
  extraCost: number;
  delayDays: number;
  status: string;
  createdAt: string;
}

interface AmendmentResponseModalProps {
  amendmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AmendmentResponseModal({
  amendmentId,
  isOpen,
  onClose,
  onSuccess,
}: AmendmentResponseModalProps) {
  const { data: session } = useSession();
  const [amendment, setAmendment] = useState<AmendmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && amendmentId) {
      fetchAmendmentDetails();
    }
  }, [isOpen, amendmentId]);

  const fetchAmendmentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/amendments/${amendmentId}`, {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAmendment(data.amendment);
      } else {
        setError("Failed to load amendment details");
      }
    } catch (error) {
      setError("An error occurred while loading amendment details");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action: "accept" | "cancel") => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/client/amendments/${amendmentId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
          body: JSON.stringify({ action }),
        }
      );

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit response");
      }
    } catch (error) {
      setError("An error occurred while submitting response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateMarkup = (baseCost: number) => {
    // Royal Gulf markup calculation (example: 15%)
    return baseCost * 0.15;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!amendment) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <p className="text-gray-500 text-center py-8">
              Amendment not found
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const markup = calculateMarkup(amendment.extraCost);
  const totalCost = amendment.extraCost + markup;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Amendment Response Required
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Reason for Amendment
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {amendment.reason}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-orange-800 mb-3">
                Cost Impact
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">Vendor-added cost:</span>
                  <span className="font-medium text-orange-800">
                    ${amendment.extraCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Delay (days):</span>
                  <span className="font-medium text-orange-800">
                    {amendment.delayDays}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">
                    Royal Gulf markup (15%):
                  </span>
                  <span className="font-medium text-orange-800">
                    ${markup.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-orange-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-orange-800 font-medium">
                      Total additional cost:
                    </span>
                    <span className="font-bold text-orange-800">
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => handleResponse("cancel")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Cancel Request"}
              </button>
              <button
                type="button"
                onClick={() => handleResponse("accept")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Accept & Proceed"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
