"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface QuoteNotification {
  id: number;
  status: string;
  commodity: string;
  containerType: string;
  numContainers: number;
  finalPrice: number | null;
  vendorQuotesReceived: number;
  timeRemaining: number | null;
  canBook: boolean;
  createdAt: string;
}

export default function QuoteNotifications() {
  const { data: session } = useSession();
  const [readyQuotes, setReadyQuotes] = useState<QuoteNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchReadyQuotes();
    }
  }, [session]);

  const fetchReadyQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/client/quotes", {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const quotes = data.quotes || [];

        // Filter quotes that are ready for booking
        const readyQuotes = quotes.filter(
          (quote: QuoteNotification) =>
            quote.status === "client_review" ||
            (quote.status === "awaiting_bids" &&
              quote.vendorQuotesReceived >= 3)
        );

        setReadyQuotes(readyQuotes);
      }
    } catch (error) {
      console.error("Failed to fetch ready quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (readyQuotes.length === 0) {
    return null; // Don't show anything if no ready quotes
  }

  return (
    <div className="mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Quotes Ready for Booking
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                You have {readyQuotes.length} quote
                {readyQuotes.length > 1 ? "s" : ""} ready to book!
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {readyQuotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-md p-3 border border-blue-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {quote.commodity} - {quote.numContainers}x{" "}
                    {quote.containerType}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {quote.vendorQuotesReceived} vendor quotes received
                  </div>
                  {quote.finalPrice && (
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      Final Price: {formatPrice(quote.finalPrice)}
                    </div>
                  )}
                  {quote.timeRemaining && quote.timeRemaining > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      ⏰ {formatTimeRemaining(quote.timeRemaining)} remaining
                    </div>
                  )}
                </div>
                <Link
                  href={`/client/quotes/${quote.id}/result`}
                  className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {quote.canBook ? "Book Now" : "View Details"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
