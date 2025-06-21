"use client";

import { useState, useEffect } from "react";

interface Invoice {
  id: number;
  shipmentId: string;
  amount: number;
  type: string;
  status: string;
  dueDate: string;
  createdAt: string;
  client: string;
  containerType: string;
  commodity: string;
}

export default function InvoiceTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState("client");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/invoices?type=${selectedType}`);
      const data = await response.json();

      if (response.ok) {
        setInvoices(data);
      } else {
        setError(data.error || "Failed to fetch invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedType]);

  const markAsPaid = async (invoiceId: number) => {
    try {
      const response = await fetch("/api/admin/invoices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId, action: "paid" }),
      });

      if (response.ok) {
        // Refresh data
        fetchInvoices();
      } else {
        const errorData = await response.json();
        console.error("Failed to mark as paid:", errorData.error);
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
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
      <div className="p-4 border-b">
        <div className="flex space-x-4">
          {["client", "vendor"].map((type) => (
            <button
              key={type}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                selectedType === type
                  ? "bg-gray-700 text-white shadow-sm"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900"
              }`}
              onClick={() => setSelectedType(type)}
            >
              {type.toUpperCase()} INVOICES
            </button>
          ))}
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shipment ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                INV-{invoice.id.toString().padStart(5, "0")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.shipmentId.substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.client}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                $
                {typeof invoice.amount === "number"
                  ? invoice.amount.toFixed(2)
                  : "0.00"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString()
                  : "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${
                    invoice.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : invoice.status === "awaiting_verification"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 mr-3">
                  View
                </button>
                {invoice.status !== "paid" && (
                  <button
                    onClick={() => markAsPaid(invoice.id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Mark as Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {invoices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No invoices found for this type
        </div>
      )}
    </div>
  );
}
