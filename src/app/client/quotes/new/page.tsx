"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface QuoteFormData {
  mode: string;
  containerType: string;
  numContainers: number;
  commodity: string;
  weightPerContainer: number;
  shipmentDate: string;
  collectionAddress: string;
}

export default function NewQuotePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<QuoteFormData>({
    mode: "FOB",
    containerType: "40ft",
    numContainers: 1,
    commodity: "",
    weightPerContainer: 0,
    shipmentDate: "",
    collectionAddress: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "numContainers" || name === "weightPerContainer"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.mode) errors.push("Shipping mode is required");
    if (!formData.containerType) errors.push("Container type is required");
    if (formData.numContainers < 1)
      errors.push("At least 1 container is required");
    if (!formData.commodity) errors.push("Commodity is required");
    if (formData.weightPerContainer < 0.1)
      errors.push("Weight must be at least 0.1 tons");
    if (!formData.shipmentDate) errors.push("Shipment date is required");

    const selectedDate = new Date(formData.shipmentDate);
    if (selectedDate <= new Date()) {
      errors.push("Shipment date must be in the future");
    }

    if (formData.mode === "Ex-Works" && !formData.collectionAddress) {
      errors.push("Collection address is required for Ex-Works");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("Form Debug - session user:", session?.user);
      console.log("Form Debug - formData:", formData);

      const response = await fetch("/api/client/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        body: JSON.stringify({
          ...formData,
          clientId: session?.user?.id,
        }),
      });

      console.log("Form Debug - response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        router.push(`/client/quotes/${data.id}`);
      } else {
        const errorData = await response.json();
        console.log("Form Debug - error data:", errorData);
        setError(errorData.error || "Failed to create quote");
      }
    } catch (error) {
      console.log("Form Debug - catch error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Request New Quote
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details below to request a shipping quote.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="mode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Shipping Mode
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md text-black bg-white  "
                >
                  <option value="Ex-Works">Ex-Works</option>
                  <option value="FOB">FOB</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="containerType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Container Type
                </label>
                <select
                  id="containerType"
                  name="containerType"
                  value={formData.containerType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md text-black bg-white"
                >
                  <option value="20ft">20ft Standard</option>
                  <option value="40ft">40ft Standard</option>
                  <option value="40HC">40ft High Cube</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="numContainers"
                  className="block text-sm font-medium text-gray-700"
                >
                  Number of Containers
                </label>
                <input
                  type="number"
                  id="numContainers"
                  name="numContainers"
                  min="1"
                  value={formData.numContainers}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="commodity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Commodity
                </label>
                <input
                  type="text"
                  id="commodity"
                  name="commodity"
                  value={formData.commodity}
                  onChange={handleInputChange}
                  placeholder="e.g., Electronics, Textiles, Machinery"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="weightPerContainer"
                  className="block text-sm font-medium text-gray-700"
                >
                  Weight per Container (tons)
                </label>
                <input
                  type="number"
                  id="weightPerContainer"
                  name="weightPerContainer"
                  step="0.1"
                  min="0.1"
                  value={formData.weightPerContainer}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="shipmentDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Shipment Date
                </label>
                <input
                  type="date"
                  id="shipmentDate"
                  name="shipmentDate"
                  value={formData.shipmentDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                />
              </div>
            </div>

            {formData.mode === "Ex-Works" && (
              <div>
                <label
                  htmlFor="collectionAddress"
                  className="block text-sm font-medium text-gray-700"
                >
                  Collection Address
                </label>
                <textarea
                  id="collectionAddress"
                  name="collectionAddress"
                  rows={3}
                  value={formData.collectionAddress}
                  onChange={handleInputChange}
                  placeholder="Enter the collection address for Ex-Works shipping"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Quote Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
