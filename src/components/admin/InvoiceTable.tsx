"use client";

import { useState, useEffect } from "react";

interface Invoice {
  id: number;
  shipmentId: number;
  userId: number;
  amount: number;
  type: "client" | "vendor";
  status: "paid" | "unpaid" | "awaiting_verification";
  dueDate: string | null;
  paymentMethod: string;
  proofUploaded: string;
  adminMarginReportGenerated: boolean;
  createdAt: string;
  client: string;
}

export default function InvoiceTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"client" | "vendor">(
    "client"
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/invoices?type=${selectedType}&status=${selectedStatus}`
        );
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

    fetchInvoices();
  }, [selectedType, selectedStatus]);

  const handleMarkAsPaid = async (invoiceId: number) => {
    try {
      const response = await fetch("/api/admin/invoices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId, action: "mark_paid" }),
      });

      if (response.ok) {
        // Refresh invoices
        const refreshResponse = await fetch(
          `/api/admin/invoices?type=${selectedType}&status=${selectedStatus}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setInvoices(refreshData);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to mark invoice as paid:", errorData.error);
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
    }
  };

  const handleUploadPayment = async (invoiceId: number, paymentProof: File) => {
    try {
      const formData = new FormData();
      formData.append("paymentProof", paymentProof);
      formData.append("invoiceId", invoiceId.toString());

      const response = await fetch("/api/admin/invoices/upload-payment", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Refresh invoices
        const refreshResponse = await fetch(
          `/api/admin/invoices?type=${selectedType}&status=${selectedStatus}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setInvoices(refreshData);
        }
        setShowPaymentModal(false);
        setSelectedInvoice(null);
      } else {
        const errorData = await response.json();
        console.error("Failed to upload payment proof:", errorData.error);
      }
    } catch (error) {
      console.error("Error uploading payment proof:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      case "awaiting_verification":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "client":
        return "bg-blue-100 text-blue-800";
      case "vendor":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalRevenue = () => {
    return invoices
      .filter(
        (invoice) => invoice.type === "client" && invoice.status === "paid"
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  const calculateTotalPayments = () => {
    return invoices
      .filter(
        (invoice) => invoice.type === "vendor" && invoice.status === "paid"
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  const calculateMargin = () => {
    return calculateTotalRevenue() - calculateTotalPayments();
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
      {/* Header with Filters and Summary */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            {["client", "vendor"].map((type) => (
              <button
                key={type}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  selectedType === type
                    ? "bg-gray-700 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                }`}
                onClick={() => setSelectedType(type as "client" | "vendor")}
              >
                {type.toUpperCase()} Invoices
              </button>
            ))}
          </div>
          <div className="flex space-x-4">
            {["all", "paid", "unpaid", "awaiting_verification"].map(
              (status) => (
                <button
                  key={status}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                    selectedStatus === status
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status.replace(/_/g, " ").toUpperCase()}
                </button>
              )
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">
              ${calculateTotalRevenue().toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">
              Total Payments
            </h3>
            <p className="text-2xl font-bold text-red-600">
              ${calculateTotalPayments().toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Net Margin</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${calculateMargin().toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shipment ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{invoice.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.shipmentId.toString().substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.client}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                    invoice.type
                  )}`}
                >
                  {invoice.type.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${invoice.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString()
                  : "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {invoice.status === "unpaid" && (
                  <>
                    <button
                      onClick={() => handleMarkAsPaid(invoice.id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowPaymentModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Upload Proof
                    </button>
                  </>
                )}
                {invoice.paymentProof && (
                  <button
                    onClick={() => window.open(invoice.paymentProof, "_blank")}
                    className="text-purple-600 hover:text-purple-900 mr-3"
                  >
                    View Proof
                  </button>
                )}
                <button className="text-gray-600 hover:text-gray-900">
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {invoices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No {selectedType} invoices found
        </div>
      )}

      {/* Payment Upload Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upload Payment Proof
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const file = formData.get("paymentProof") as File;
                  if (file) {
                    handleUploadPayment(selectedInvoice.id, file);
                  }
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof (PDF/Image)
                  </label>
                  <input
                    type="file"
                    name="paymentProof"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
