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
          setError("Failed to load quote result");
        }
      } catch {
        setError("An error occurred while loading quote result");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && shipmentId) {
      fetchQuoteResult();
    }
  }, [session, shipmentId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
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
        setError("Failed to book shipment");
      }
    } catch {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!quoteResult) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No quote result available</p>
      </div>
    );
  }

  const isTimerExpired = timeRemaining <= 0;
  const hasEnoughQuotes = quoteResult.vendorQuotesReceived >= 3;
  const canBook = isTimerExpired || hasEnoughQuotes;

  return (
    <div className="bg-white shadow rounded-lg p-6">
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

      {/* Final Price */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="text-center">
          <p className="text-sm text-green-600 font-medium mb-2">
            Final Price (with 14% markup)
          </p>
          <p className="text-3xl font-bold text-green-700">
            {formatPrice(quoteResult.finalPrice)}
          </p>
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
            Royal Gulf's quote is{" "}
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
              ? "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
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
            By clicking "Book Now", you agree to proceed with this shipment at
            the quoted price.
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
