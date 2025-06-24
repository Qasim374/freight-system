"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Quote {
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

interface QuoteBid {
  id: number;
  vendorId: number;
  costUsd: string;
  sailingDate: string;
  carrierName: string;
  status: string;
  markupApplied: boolean;
  createdAt: string;
}

export default function QuoteDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [bids, setBids] = useState<QuoteBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuoteDetails = async () => {
      try {
        // Fetch quote details
        const quoteResponse = await fetch(`/api/client/quotes/${params.id}`, {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          setQuote(quoteData.quote);
          setBids(quoteData.bids || []);
        } else {
          setError("Quote not found");
        }
      } catch {
        setError("An error occurred while loading quote details");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && params.id) {
      fetchQuoteDetails();
    }
  }, [session, params.id]);

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
        return "AWAITING BIDS";
      case "bids_received":
        return "BIDS RECEIVED";
      case "client_review":
        return "UNDER REVIEW";
      case "booked":
        return "BOOKED";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Quote not found"}</p>
            <Link
              href="/client/quotes"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              Back to Quotes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/client/quotes"
                className="text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Back to Quotes
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Quote Request #{quote.id}
              </h1>
              <p className="text-gray-600 mt-1">
                View details and vendor responses for this quote request
              </p>
            </div>
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                quote.status
              )}`}
            >
              {getStatusLabel(quote.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quote Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Quote Request Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Commodity
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {quote.commodity}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Container Type
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {quote.containerType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Number of Containers
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {quote.numContainers}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Shipment Date
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {formatDate(quote.shipmentDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mode</dt>
                  <dd className="text-sm text-gray-900 mt-1">{quote.mode}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {formatDate(quote.createdAt)}
                  </dd>
                </div>
                {quote.weightPerContainer && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Weight per Container
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {parseFloat(quote.weightPerContainer).toFixed(2)} tons
                    </dd>
                  </div>
                )}
                {quote.finalPrice && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Final Price
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1 font-semibold">
                      {formatCurrency(quote.finalPrice)}
                    </dd>
                  </div>
                )}
              </div>

              {quote.collectionAddress && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Collection Address
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {quote.collectionAddress}
                  </dd>
                </div>
              )}
            </div>

            {/* Vendor Bids */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Vendor Bids ({bids.length})
              </h2>
              {bids.length > 0 ? (
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <div
                      key={bid.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {bid.carrierName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Sailing Date: {formatDate(bid.sailingDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cost: {formatCurrency(bid.costUsd)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              bid.status === "selected"
                                ? "bg-green-100 text-green-800"
                                : bid.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {bid.status.toUpperCase()}
                          </span>
                          {bid.markupApplied && (
                            <p className="text-xs text-gray-500 mt-1">
                              Markup Applied
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No bids received yet
                </p>
              )}
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Actions
              </h2>
              <div className="space-y-3">
                {quote.status === "bids_received" && (
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Review Bids
                  </button>
                )}
                {quote.status === "booked" && (
                  <Link
                    href={`/client/shipments/${quote.id}`}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-center block"
                  >
                    View Shipment
                  </Link>
                )}
                <Link
                  href="/client/quotes"
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-center block"
                >
                  Back to Quotes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
