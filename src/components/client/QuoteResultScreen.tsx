"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface QuoteResult {
  id: string;
  finalPrice: number;
  sailingDate: string;
  marketComparison: string;
  commodity: string;
  containerType: string;
  numberOfContainers: number;
  weightPerContainer: number;
  quoteRequestedAt: string;
  vendorQuotesReceived: number;
  totalVendors: number;
  timeRemaining?: number; // in seconds
  winningVendor?: {
    name: string;
    cost: number;
    sailingDate: string;
  };
  markupAmount?: number;
}

interface QuoteResultScreenProps {
  shipmentId: string;
}

export default function QuoteResultScreen({
  shipmentId,
}: QuoteResultScreenProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    const fetchQuoteResult = async () => {
      try {
        const response = await fetch(
          `/api/client/quotes/${shipmentId}/result`,
          {
            headers: {
              "x-user-id": session?.user?.id || "",
              "x-user-role": session?.user?.role || "",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setQuoteResult(data.quoteResult);

          // Calculate time remaining
          if (data.quoteResult.quoteRequestedAt) {
            const requestedAt = new Date(data.quoteResult.quoteRequestedAt);
            const deadline = new Date(
              requestedAt.getTime() + 48 * 60 * 60 * 1000
            ); // 48 hours
            const now = new Date();
            const remaining = Math.max(
              0,
              Math.floor((deadline.getTime() - now.getTime()) / 1000)
            );
            setTimeRemaining(remaining);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load quote result");
        }
      } catch (error) {
        console.error("Error fetching quote result:", error);
        setError("An error occurred while loading quote result");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && shipmentId) {
      fetchQuoteResult();
    }
  }, [session, shipmentId]);

  // Auto-refresh when timer expires or quotes are received
  useEffect(() => {
    if (
      timeRemaining <= 0 ||
      (quoteResult && quoteResult.vendorQuotesReceived >= 3)
    ) {
      setAutoRefresh(true);
    }
  }, [timeRemaining, quoteResult]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // Timer expired, trigger refresh
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBookNow = async () => {
    if (!quoteResult) return;

    setIsBooking(true);
    setError("");

    try {
      const response = await fetch(`/api/client/quotes/${shipmentId}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/client/shipments/${data.shipmentId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to book shipment");
      }
    } catch (error) {
      console.error("Error booking shipment:", error);
      setError("An error occurred while booking");
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const calculateMarkup = (basePrice: number) => {
    return basePrice * 0.14; // 14% markup
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading quote details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg
            className="h-12 w-12 text-red-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Quote
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!quoteResult) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
          <svg
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Quote Available
          </h3>
          <p className="text-gray-600">
            No quote result available for this request.
          </p>
        </div>
      </div>
    );
  }

  const isTimerExpired = timeRemaining <= 0;
  const hasEnoughQuotes = quoteResult.vendorQuotesReceived >= 3;
  const canBook = isTimerExpired || hasEnoughQuotes;
  const markupAmount =
    quoteResult.markupAmount || calculateMarkup(quoteResult.finalPrice);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Auto-refresh notification */}
      {autoRefresh && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-blue-700">
              {isTimerExpired
                ? "Timer expired! Refreshing quote details..."
                : "Quotes received! Refreshing quote details..."}
            </p>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Result</h2>
        <p className="text-gray-600">
          {hasEnoughQuotes
            ? "3 vendor quotes received! You can now book your shipment."
            : "Vendors are still submitting quotes. You can book once 3 quotes are received or 48 hours elapse."}
        </p>
      </div>

      {/* 48-Hour Timer */}
      <div
        className={`border rounded-lg p-4 mb-6 ${
          isTimerExpired
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isTimerExpired
              ? "48-Hour Timer Expired"
              : "48-Hour Vendor Bidding Timer"}
          </h3>
          {!isTimerExpired && (
            <div className="text-2xl font-mono font-bold text-yellow-700 mb-2">
              {formatTimeRemaining(timeRemaining)}
            </div>
          )}
          <div className="text-sm text-gray-600">
            {quoteResult.vendorQuotesReceived} of {quoteResult.totalVendors}{" "}
            vendor quotes received
          </div>
          {isTimerExpired && (
            <div className="text-sm text-red-600 font-medium mt-2">
              Timer expired. You can now book with available quotes.
            </div>
          )}
        </div>
      </div>

      {/* Final Price Breakdown */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="text-center mb-4">
          <p className="text-sm text-green-600 font-medium mb-2">
            Final Price (with 14% markup)
          </p>
          <p className="text-3xl font-bold text-green-700">
            {formatPrice(quoteResult.finalPrice)}
          </p>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-lg p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Vendor Cost:</span>
              <span className="font-medium">
                {formatPrice(quoteResult.finalPrice - markupAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Royal Gulf Markup (14%):</span>
              <span className="font-medium text-green-600">
                {formatPrice(markupAmount)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total Cost:</span>
              <span className="text-green-700">
                {formatPrice(quoteResult.finalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Shipment Details
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500">Commodity:</span>
              <span className="ml-2 font-medium text-gray-900">
                {quoteResult.commodity}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Container:</span>
              <span className="ml-2 font-medium text-gray-900">
                {quoteResult.numberOfContainers}x {quoteResult.containerType}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Weight per Container:</span>
              <span className="ml-2 font-medium text-gray-900">
                {quoteResult.weightPerContainer} tons
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Shipping Details
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500">Sailing Date:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatDate(quoteResult.sailingDate)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Carrier:</span>
              <span className="ml-2 font-medium text-gray-900">
                Confidential
              </span>
            </div>
            {quoteResult.winningVendor && (
              <div>
                <span className="text-gray-500">Winning Vendor:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {quoteResult.winningVendor.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Market Comparison */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Market Comparison
        </h3>
        <p className="text-blue-700">{quoteResult.marketComparison}</p>
        <div className="mt-2 text-sm text-blue-600">
          <span className="font-medium">
            Royal Gulf&apos;s quote is{" "}
            {quoteResult.marketComparison.includes("below")
              ? "below"
              : "in range with"}{" "}
            market rates.
          </span>
        </div>
      </div>

      {/* Book Now Button */}
      <div className="text-center">
        <button
          onClick={handleBookNow}
          disabled={isBooking || !canBook}
          className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            canBook
              ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isBooking ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
              Booking...
            </>
          ) : !canBook ? (
            "Waiting for Quotes..."
          ) : (
            "Book Now"
          )}
        </button>
        {canBook && (
          <p className="text-sm text-gray-500 mt-2">
            By clicking &quot;Book Now&quot;, you agree to proceed with this
            shipment at the quoted price.
          </p>
        )}
        {!canBook && (
          <p className="text-sm text-gray-500 mt-2">
            You can book once 3 vendor quotes are received or the 48-hour timer
            expires.
          </p>
        )}
      </div>
    </div>
  );
}
