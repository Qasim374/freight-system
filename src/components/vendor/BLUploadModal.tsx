"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface WonShipment {
  id: number;
  containerType: string;
  commodity: string;
  origin: string;
  destination: string;
  status: string;
  quoteId: number;
  cost: string;
  sailingDate: string;
  carrierName: string;
  draftBl?: string;
  finalBl?: string;
}

interface BLUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: WonShipment;
  blType: "draft" | "final";
  onBLUploaded: () => void;
}

export default function BLUploadModal({
  isOpen,
  onClose,
  shipment,
  blType,
  onBLUploaded,
}: BLUploadModalProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (
        !selectedFile.type.includes("pdf") &&
        !selectedFile.type.includes("image")
      ) {
        setError("Please upload a PDF or image file");
        return;
      }
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("shipmentId", shipment.id.toString());
      formData.append("blType", blType);

      const response = await fetch("/api/vendor/upload-bl", {
        method: "POST",
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: formData,
      });

      if (response.ok) {
        onBLUploaded();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to upload BL");
      }
    } catch (error) {
      console.error("Error uploading BL:", error);
      setError("Network error occurred");
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
              Upload {blType === "draft" ? "Draft" : "Final"} BL for Shipment #
              {shipment.id.toString().substring(0, 8)}
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
                  Route
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {shipment.origin} → {shipment.destination}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Carrier
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {shipment.carrierName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cost
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  ${parseFloat(shipment.cost).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sailing Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(shipment.sailingDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="file"
                className="block text-sm font-medium text-gray-700"
              >
                Upload {blType === "draft" ? "Draft" : "Final"} BL *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, JPG, PNG up to 5MB
                  </p>
                </div>
              </div>
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected file: {file.name}
                </div>
              )}
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
                disabled={loading || !file}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Uploading..."
                  : `Upload ${blType === "draft" ? "Draft" : "Final"} BL`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
