"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Quote {
  id: string;
  status: string;
  containerType: string;
  commodity: string;
  numberOfContainers: number;
  preferredShipmentDate: string;
  createdAt: string;
  quoteDeadline?: string;
  quoteRequestedAt?: string;
  quotes?: Array<{
    id: number;
    cost: number;
    carrierName: string;
    sailingDate: string;
    isWinner: boolean;
  }>;
}

export default function QuoteDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuoteDetails = async () => {
      try {
        const response = await fetch(`/api/client/quotes`, {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const foundQuote = data.quotes?.find(
            (q: Quote) => q.id === params.id
          );
          if (foundQuote) {
            setQuote(foundQuote);
          } else {
            setError("Quote not found");
          }
        } else {
          setError("Failed to load quote details");
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
      case "quote_requested":
        return "bg-yellow-100 text-yellow-800";
      case "quote_received":
        return "bg-gray-100 text-gray-800";
      case "booked":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
                Quote Request #{quote.id.substring(0, 8)}
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
              {quote.status.replace("_", " ").toUpperCase()}
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
                    {quote.numberOfContainers}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Preferred Shipment Date
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {formatDate(quote.preferredShipmentDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {formatDate(quote.createdAt)}
                  </dd>
                </div>
                {quote.quoteDeadline && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Quote Deadline
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {formatDate(quote.quoteDeadline)}
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* Vendor Quotes */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Vendor Responses ({quote.quotes?.length || 0})
              </h2>
              {quote.quotes && quote.quotes.length > 0 ? (
                <div className="space-y-4">
                  {quote.quotes.map((vendorQuote) => (
                    <div
                      key={vendorQuote.id}
                      className={`border rounded-lg p-4 ${
                        vendorQuote.isWinner
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {vendorQuote.carrierName}
                            {vendorQuote.isWinner && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Winner
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Sailing Date: {formatDate(vendorQuote.sailingDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(vendorQuote.cost)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No vendor responses yet. Check back later for quotes.
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
                {quote.status === "quote_requested" && (
                  <button
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                    disabled
                  >
                    Waiting for Quotes
                  </button>
                )}
                {quote.status === "quote_confirmed" && (
                  <Link
                    href={`/client/quotes/${quote.id}/result`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    View Quote Result
                  </Link>
                )}
                {quote.status === "quote_received" && (
                  <Link
                    href={`/client/quotes/${quote.id}/book`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Book Shipment
                  </Link>
                )}
                {quote.status === "booked" && (
                  <Link
                    href={`/client/shipments/${quote.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Track Shipment
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
