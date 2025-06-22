"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface QuoteRequest {
  id: string;
  status: string;
  containerType: string;
  commodity: string;
  numberOfContainers: number;
  preferredShipmentDate: string;
  createdAt: string;
  quoteDeadline?: string;
  quotes?: Array<{ id: number; cost: number; carrierName: string }>;
}

export default function RequestQuoteTab() {
  const { data: session } = useSession();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuoteRequests = async () => {
      try {
        const response = await fetch("/api/client/quotes", {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuoteRequests(data.quotes || []);
        }
      } catch (error) {
        console.error("Failed to fetch quote requests:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchQuoteRequests();
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "quote_requested":
        return "bg-yellow-100 text-yellow-800";
      case "quote_received":
        return "bg-blue-100 text-blue-800";
      case "quote_confirmed":
        return "bg-green-100 text-green-800";
      case "booking":
        return "bg-purple-100 text-purple-800";
      case "booked":
        return "bg-green-100 text-green-800";
      case "draft_bl":
        return "bg-orange-100 text-orange-800";
      case "final_bl":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "loading":
        return "bg-indigo-100 text-indigo-800";
      case "sailed":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "quote_requested":
        return "Awaiting Vendor Rates";
      case "quote_received":
        return "Quotes Received";
      case "quote_confirmed":
        return "Quote Confirmed";
      case "booking":
        return "Booking in Progress";
      case "booked":
        return "Booked";
      case "draft_bl":
        return "Draft BL Pending";
      case "final_bl":
        return "Final BL Ready";
      case "in_transit":
        return "In Transit";
      case "loading":
        return "Loading";
      case "sailed":
        return "Sailed";
      case "delivered":
        return "Delivered";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff <= 0) return "Expired";
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Quote Requests</h2>
        <Link
          href="/client/quotes/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
        >
          Request New Quote
        </Link>
      </div> */}

      {quoteRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Quote Requests
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by requesting your first shipping quote.
          </p>
          <Link
            href="/client/quotes/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
          >
            Create Your First Quote Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quoteRequests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      #{request.id.substring(0, 8)}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Commodity:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {request.commodity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Container:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {request.numberOfContainers}x {request.containerType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Shipment Date:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(request.preferredShipmentDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Quotes:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {request.quotes?.length || 0} received
                      </span>
                    </div>
                  </div>

                  {request.quoteDeadline &&
                    request.status === "quote_requested" && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="ml-2 font-medium text-orange-600">
                          {getTimeRemaining(request.quoteDeadline)}
                        </span>
                      </div>
                    )}
                </div>

                <div className="ml-4">
                  {request.status === "quote_confirmed" ? (
                    <Link
                      href={`/client/quotes/${request.id}/result`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      View Quote
                    </Link>
                  ) : request.status === "booked" ||
                    request.status === "in_transit" ||
                    request.status === "loading" ||
                    request.status === "sailed" ? (
                    <Link
                      href={`/client/shipments/${request.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Track Shipment
                    </Link>
                  ) : request.status === "delivered" ? (
                    <span className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100">
                      Completed
                    </span>
                  ) : (
                    <Link
                      href={`/client/quotes/${request.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
