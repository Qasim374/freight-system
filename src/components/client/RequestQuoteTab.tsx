"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface QuoteRequest {
  id: number;
  status: string;
  containerType: string;
  commodity: string;
  numContainers: number;
  shipmentDate: string;
  createdAt: string;
  finalPrice: string | null;
  mode: string;
  weightPerContainer: string | null;
  collectionAddress: string | null;
  bidCount: number;
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
      case "awaiting_bids":
        return "bg-yellow-100 text-yellow-800";
      case "bids_received":
        return "bg-blue-100 text-blue-800";
      case "client_review":
        return "bg-purple-100 text-purple-800";
      case "booked":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "awaiting_bids":
        return "Awaiting Vendor Bids";
      case "bids_received":
        return "Bids Received";
      case "client_review":
        return "Under Review";
      case "booked":
        return "Booked";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
                      #{request.id}
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
                        {request.numContainers}x {request.containerType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Shipment Date:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(request.shipmentDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mode:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {request.mode}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span>Bids received: {request.bidCount}</span>
                      {request.finalPrice && (
                        <span className="ml-4">
                          Final Price: $
                          {parseFloat(request.finalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/client/quotes/${request.id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
