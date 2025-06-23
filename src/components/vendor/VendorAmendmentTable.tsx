"use client";

interface AmendmentRequest {
  id: string;
  shipmentId: string;
  requestType: string;
  description: string;
  status: string;
  createdAt: string;
  extraCost?: string;
  delayDays?: number;
  reason?: string;
}

interface VendorAmendmentTableProps {
  amendments: AmendmentRequest[];
  onRespondToAmendment: (amendment: AmendmentRequest) => void;
}

export default function VendorAmendmentTable({ amendments, onRespondToAmendment }: VendorAmendmentTableProps) {
  if (amendments.length === 0) {
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No amendment requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are currently no amendment requests for your shipments.
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
              Shipment ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Request Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Requested
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {amendments.map((amendment) => (
            <tr key={amendment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{amendment.shipmentId.substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="capitalize">{amendment.requestType.replace(/_/g, " ")}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <div className="max-w-xs truncate" title={amendment.description}>
                  {amendment.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  amendment.status === "pending" 
                    ? "bg-yellow-100 text-yellow-800"
                    : amendment.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : amendment.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {amendment.status.charAt(0).toUpperCase() + amendment.status.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(amendment.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {amendment.status === "pending" ? (
                  <button
                    onClick={() => onRespondToAmendment(amendment)}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                  >
                    Respond
                  </button>
                ) : (
                  <div className="text-gray-500 text-xs">
                    {amendment.extraCost && `+$${amendment.extraCost}`}
                    {amendment.delayDays && ` +${amendment.delayDays} days`}
                    {amendment.reason && (
                      <div className="mt-1 text-gray-400">
                        {amendment.reason.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 