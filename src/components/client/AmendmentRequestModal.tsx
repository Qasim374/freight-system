"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface AmendmentRequestModalProps {
  shipmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const amendmentReasons = [
  "Documentation Error",
  "Container Details Incorrect",
  "Port Information Wrong",
  "Commodity Description Error",
  "Weight Information Incorrect",
  "Other",
];

export default function AmendmentRequestModal({
  shipmentId,
  isOpen,
  onClose,
  onSuccess,
}: AmendmentRequestModalProps) {
  const { data: session } = useSession();
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason && !customReason) {
      setError("Please select or specify a reason");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("shipmentId", shipmentId);
      formData.append("reason", customReason || reason);
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/client/amendments/request", {
        method: "POST",
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: formData,
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setReason("");
        setCustomReason("");
        setFile(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit amendment request");
      }
    } catch (error) {
      setError("An error occurred while submitting the request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Request Amendment
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Amendment
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Select a reason</option>
                {amendmentReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {reason === "Other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Please specify the reason for amendment..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
