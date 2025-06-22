"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface QuoteFormData {
  mode: string;
  containerType: string;
  numberOfContainers: number;
  commodity: string;
  weightPerContainer: number;
  preferredShipmentDate: string;
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
    numberOfContainers: 1,
    commodity: "",
    weightPerContainer: 0,
    preferredShipmentDate: "",
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
        name === "numberOfContainers" || name === "weightPerContainer"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.mode) errors.push("Shipping mode is required");
    if (!formData.containerType) errors.push("Container type is required");
    if (formData.numberOfContainers < 1)
      errors.push("At least 1 container is required");
    if (!formData.commodity) errors.push("Commodity is required");
    if (formData.weightPerContainer < 0.1)
      errors.push("Weight must be at least 0.1 tons");
    if (!formData.preferredShipmentDate)
      errors.push("Preferred shipment date is required");

    const selectedDate = new Date(formData.preferredShipmentDate);
    if (selectedDate <= new Date()) {
      errors.push("Preferred shipment date must be in the future");
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
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md text-black bg-white"
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
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md text-black bg-white"
                >
                  <option value="20ft">20ft Standard</option>
                  <option value="40ft">40ft Standard</option>
                  <option value="40HC">40ft High Cube</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="numberOfContainers"
                  className="block text-sm font-medium text-gray-700"
                >
                  Number of Containers
                </label>
                <input
                  type="number"
                  id="numberOfContainers"
                  name="numberOfContainers"
                  value={formData.numberOfContainers}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-black bg-white"
                  min="1"
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
                  value={formData.weightPerContainer}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-black bg-white"
                  step="0.1"
                  min="0.1"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-black bg-white"
                  placeholder="e.g., Electronics, Textiles, Machinery"
                />
              </div>

              <div>
                <label
                  htmlFor="preferredShipmentDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Preferred Shipment Date
                </label>
                <input
                  type="date"
                  id="preferredShipmentDate"
                  name="preferredShipmentDate"
                  value={formData.preferredShipmentDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-black bg-white"
                />
              </div>

              {formData.mode === "Ex-Works" && (
                <div className="sm:col-span-2">
                  <label
                    htmlFor="collectionAddress"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Collection Address
                  </label>
                  <textarea
                    id="collectionAddress"
                    name="collectionAddress"
                    value={formData.collectionAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-black bg-white"
                    placeholder="Full address for collection"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Request Quote"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
