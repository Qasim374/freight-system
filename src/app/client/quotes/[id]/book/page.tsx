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

export default function BookShipmentPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
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

  const handleBookShipment = async () => {
    if (!quote) return;

    setBooking(true);
    setError("");

    try {
      const response = await fetch(`/api/client/quotes/${quote.id}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        // Redirect to shipment tracking page
        router.push(`/client/shipments/${quote.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to book shipment");
      }
    } catch (error) {
      setError("An error occurred while booking shipment");
    } finally {
      setBooking(false);
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

  const calculateMarkup = (baseCost: number) => {
    // Royal Gulf markup calculation (14%)
    return baseCost * 0.14;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        </div>
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

  // Find the lowest cost quote
  const lowestQuote = quote.quotes?.reduce((lowest, current) =>
    current.cost < lowest.cost ? current : lowest
  );

  if (!lowestQuote) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">No quotes available for booking</p>
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

  const markup = calculateMarkup(lowestQuote.cost);
  const totalCost = lowestQuote.cost + markup;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/client/quotes/${quote.id}`}
            className="text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to Quote Details
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Book Shipment #{quote.id.substring(0, 8)}
          </h1>
          <p className="text-gray-600 mt-1">
            Review and confirm your shipment booking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipment Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Shipment Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Commodity:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {quote.commodity}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Container Type:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {quote.containerType}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Number of Containers:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {quote.numberOfContainers}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Preferred Shipment Date:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {formatDate(quote.preferredShipmentDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Quote Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Best Quote Summary
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-800">
                    Vendor Cost:
                  </span>
                  <span className="text-sm font-medium text-green-800">
                    {formatCurrency(lowestQuote.cost)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-800">
                    Royal Gulf Markup (14%):
                  </span>
                  <span className="text-sm font-medium text-green-800">
                    {formatCurrency(markup)}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-800">
                      Total Cost:
                    </span>
                    <span className="text-lg font-bold text-green-800">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  <strong>Sailing Date:</strong>{" "}
                  {formatDate(lowestQuote.sailingDate)}
                </p>
                <p className="mt-1">
                  <strong>Market Comparison:</strong> Royal Gulf&apos;s quote is
                  competitive and within market range.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Actions */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Confirm Booking
          </h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> By clicking &quot;Confirm
                Booking&quot;, you agree to proceed with this shipment. The
                winning vendor will be locked and the shipment will move to the
                Bill of Lading workflow.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <Link
                href={`/client/quotes/${quote.id}`}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                onClick={handleBookShipment}
                disabled={booking}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {booking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
