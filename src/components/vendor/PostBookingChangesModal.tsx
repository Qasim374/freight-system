"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface PostBookingChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  onChangeSubmitted: () => void;
}

export default function PostBookingChangesModal({
  isOpen,
  onClose,
  shipmentId,
  onChangeSubmitted,
}: PostBookingChangeModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    reason: "",
    extraCost: "",
    delayDays: "",
    changeType: "port_congestion",
    fileUpload: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("shipmentId", shipmentId);
      formDataToSend.append("reason", formData.reason);
      formDataToSend.append("extraCost", formData.extraCost);
      formDataToSend.append("delayDays", formData.delayDays);
      formDataToSend.append("changeType", formData.changeType);
      if (formData.fileUpload) {
        formDataToSend.append("fileUpload", formData.fileUpload);
      }

      const response = await fetch("/api/vendor/post-booking-changes", {
        method: "POST",
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: formDataToSend,
      });

      if (response.ok) {
        onChangeSubmitted();
        onClose();
        // Reset form
        setFormData({
          reason: "",
          extraCost: "",
          delayDays: "",
          changeType: "port_congestion",
          fileUpload: null,
        });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit change request");
      }
    } catch (error) {
      console.error("Error submitting change request:", error);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      fileUpload: file || null,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Propose Post-Booking Change
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="changeType"
                className="block text-sm font-medium text-gray-700"
              >
                Change Type *
              </label>
              <select
                id="changeType"
                name="changeType"
                value={formData.changeType}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="port_congestion">Port Congestion</option>
                <option value="weather_delay">Weather Delay</option>
                <option value="equipment_shortage">Equipment Shortage</option>
                <option value="route_change">Route Change</option>
                <option value="carrier_schedule_change">
                  Carrier Schedule Change
                </option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                Detailed Reason *
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={4}
                value={formData.reason}
                onChange={handleInputChange}
                required
                placeholder="Please provide detailed explanation of the change and its impact..."
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="extraCost"
                  className="block text-sm font-medium text-gray-700"
                >
                  Additional Cost (USD)
                </label>
                <input
                  type="number"
                  id="extraCost"
                  name="extraCost"
                  step="0.01"
                  min="0"
                  value={formData.extraCost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="delayDays"
                  className="block text-sm font-medium text-gray-700"
                >
                  Delay (Days)
                </label>
                <input
                  type="number"
                  id="delayDays"
                  name="delayDays"
                  min="0"
                  value={formData.delayDays}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="fileUpload"
                className="block text-sm font-medium text-gray-700"
              >
                Supporting Documentation
              </label>
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload supporting documents (optional)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Important Notice
              </h4>
              <p className="text-sm text-blue-700">
                Post-booking changes require client approval and may impact the
                final cost and delivery timeline. Please ensure all information
                provided is accurate and supported by documentation.
              </p>
            </div>

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
                {loading ? "Submitting..." : "Submit Change Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
