"use client";

interface QuoteRequest {
  id: number;
  containerType: string;
  commodity: string;
  origin: string;
  destination: string;
  status: string;
  createdAt: string;
  clientId: number;
  clientName?: string;
  myBid?: {
    cost: number;
    status: string;
    submittedAt: string;
    isFastest: boolean;
    winPercentage?: number;
  };
  totalBids?: number;
  lowestBid?: number;
}

interface VendorQuoteTableProps {
  requests: QuoteRequest[];
  onSubmitQuote: (request: QuoteRequest) => void;
}

export default function VendorQuoteTable({
  requests,
  onSubmitQuote,
}: VendorQuoteTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
        return "Awaiting Bids";
      case "bids_received":
        return "Bids Received";
      case "client_review":
        return "Client Review";
      case "booked":
        return "Booked";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No quote requests available
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for new opportunities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Request ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Container Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commodity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Origin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              My Bid
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Competition
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{request.id.toString().substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.containerType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.commodity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.origin || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    request.status
                  )}`}
                >
                  {getStatusLabel(request.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.myBid ? (
                  <div className="space-y-1">
                    <div className="font-medium">
                      ${request.myBid.cost.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(request.myBid.submittedAt)}
                    </div>
                    {request.myBid.isFastest && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        ⚡ Fastest Quote
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">Not submitted</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.myBid && request.lowestBid ? (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">
                      {request.totalBids} total bids
                    </div>
                    {request.myBid.status === "selected" ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        🏆 Won
                      </span>
                    ) : request.myBid.status === "rejected" ? (
                      <div className="text-xs">
                        <span className="text-red-600 font-medium">
                          Lost by {request.myBid.winPercentage?.toFixed(1)}%
                        </span>
                        <div className="text-gray-500">
                          Lowest: ${request.lowestBid.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {!request.myBid ? (
                  <button
                    onClick={() => onSubmitQuote(request)}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                  >
                    Submit Quote
                  </button>
                ) : (
                  <span className="text-gray-400">Already submitted</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
