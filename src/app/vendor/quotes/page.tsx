"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import VendorQuoteTable from "@/components/vendor/VendorQuoteTable";
import QuoteSubmissionModal from "@/components/vendor/QuoteSubmissionModal";

interface QuoteRequest {
  id: string;
  containerType: string;
  commodity: string;
  origin: string;
  destination: string;
  status: string;
  createdAt: string;
  clientId: number;
  clientName?: string;
}

export default function VendorQuotesPage() {
  const { data: session } = useSession();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchQuoteRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/vendor/quote-requests", {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuoteRequests(data.requests || []);
        }
      } catch (error) {
        console.error("Error fetching quote requests:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchQuoteRequests();
    }
  }, [session]);

  const handleSubmitQuote = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleQuoteSubmitted = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    // Refresh the quote requests
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-gray-600 mt-2">
            View and submit quotes for available shipping requests
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Available Requests ({quoteRequests.length})
            </h2>
          </div>

          <VendorQuoteTable
            requests={quoteRequests}
            onSubmitQuote={handleSubmitQuote}
          />
        </div>

        {selectedRequest && (
          <QuoteSubmissionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            request={selectedRequest}
            onQuoteSubmitted={handleQuoteSubmitted}
          />
        )}
      </div>
    </div>
  );
}
