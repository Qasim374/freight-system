"use client";

interface WonShipment {
  id: string;
  containerType: string;
  commodity: string;
  origin: string;
  destination: string;
  status: string;
  quoteId: number;
  cost: string;
  sailingDate: string;
  carrierName: string;
  draftBL?: string;
  finalBL?: string;
}

interface VendorBLTableProps {
  shipments: WonShipment[];
  onUploadBL: (shipment: WonShipment, type: "draft" | "final") => void;
}

export default function VendorBLTable({
  shipments,
  onUploadBL,
}: VendorBLTableProps) {
  if (shipments.length === 0) {
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No won shipments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't won any shipments yet. Keep submitting competitive
            quotes!
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
              Route
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sailing Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Carrier
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              BL Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{shipment.id.substring(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>
                  <div className="font-medium">{shipment.origin || "N/A"}</div>
                  <div className="text-gray-400">→</div>
                  <div className="font-medium">
                    {shipment.destination || "N/A"}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${parseFloat(shipment.cost).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(shipment.sailingDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {shipment.carrierName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      shipment.draftBL
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    Draft: {shipment.draftBL ? "Uploaded" : "Pending"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      shipment.finalBL
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Final: {shipment.finalBL ? "Uploaded" : "Pending"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col space-y-2">
                  {!shipment.draftBL && (
                    <button
                      onClick={() => onUploadBL(shipment, "draft")}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors text-xs"
                    >
                      Upload Draft BL
                    </button>
                  )}
                  {shipment.draftBL && !shipment.finalBL && (
                    <button
                      onClick={() => onUploadBL(shipment, "final")}
                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors text-xs"
                    >
                      Upload Final BL
                    </button>
                  )}
                  {shipment.draftBL && (
                    <button
                      onClick={() => window.open(shipment.draftBL, "_blank")}
                      className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors text-xs"
                    >
                      View Draft BL
                    </button>
                  )}
                  {shipment.finalBL && (
                    <button
                      onClick={() => window.open(shipment.finalBL, "_blank")}
                      className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors text-xs"
                    >
                      View Final BL
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
