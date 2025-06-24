import React from "react";

interface Shipment {
  id: number;
  shipmentStatus: string;
  trackingStatus: string;
  carrierReference: string | null;
  eta: string | null;
  createdAt: string;
}

interface RecentShipmentsProps {
  shipments: Shipment[];
}

const RecentShipments: React.FC<RecentShipmentsProps> = ({ shipments }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "draft_bl_uploaded":
        return "bg-purple-100 text-purple-800";
      case "final_bl_uploaded":
        return "bg-indigo-100 text-indigo-800";
      case "in_transit":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrackingStatusColor = (status: string) => {
    switch (status) {
      case "quote_confirmed":
        return "bg-green-100 text-green-800";
      case "booking":
        return "bg-blue-100 text-blue-800";
      case "loading":
        return "bg-yellow-100 text-yellow-800";
      case "sailed":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Recent Shipments
      </h2>
      <div className="space-y-4">
        {shipments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No shipments found</p>
        ) : (
          shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="border-b border-gray-200 pb-4 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Shipment #{shipment.id}
                  </h4>
                  {shipment.carrierReference && (
                    <p className="text-sm text-gray-500">
                      Carrier Ref: {shipment.carrierReference}
                    </p>
                  )}
                  {shipment.eta && (
                    <p className="text-sm text-gray-500">
                      ETA: {formatDate(shipment.eta)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Created: {formatDate(shipment.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      shipment.shipmentStatus
                    )}`}
                  >
                    {shipment.shipmentStatus.replace("_", " ").toUpperCase()}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTrackingStatusColor(
                      shipment.trackingStatus
                    )}`}
                  >
                    {shipment.trackingStatus.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentShipments;
