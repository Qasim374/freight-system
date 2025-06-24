"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface LogDetails {
  description?: string;
  amount?: number;
  reason?: string;
  carrierReference?: string;
  extraCost?: number;
  delayDays?: number;
}

interface ShipmentLog {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  actor: string;
}

interface ShipmentHistory {
  id: number;
  shipmentStatus: string;
  trackingStatus: string;
  carrierReference: string | null;
  eta: string | null;
  createdAt: string;
  commodity: string;
  containerType: string;
  mode: string;
  collectionAddress: string | null;
  shipmentDate: string | null;
  finalPrice: number | null;
  logs: ShipmentLog[];
}

export default function ShipmentHistoryTab() {
  const { data: session } = useSession();
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedShipments, setExpandedShipments] = useState<Set<number>>(
    new Set()
  );

  const fetchShipmentHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/client/shipments/history", {
        headers: {
          "x-user-id": session?.user?.id || "",
          "x-user-role": session?.user?.role || "",
        },
        cache: "no-store", // Prevent caching
      });

      if (response.ok) {
        const data = await response.json();
        setShipmentHistory(data.shipments || []);
      } else {
        setError("Failed to fetch shipment history");
      }
    } catch (error) {
      console.error("Failed to fetch shipment history:", error);
      setError("An error occurred while loading shipment history");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchShipmentHistory();
    }
  }, [session, fetchShipmentHistory]);

  const toggleShipmentExpansion = (shipmentId: number) => {
    setExpandedShipments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(shipmentId)) {
        newSet.delete(shipmentId);
      } else {
        newSet.add(shipmentId);
      }
      return newSet;
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "quote_requested":
        return "📋";
      case "quote_submitted":
        return "📨";
      case "quote_selected":
        return "✅";
      case "quote_booked":
        return "🚢";
      case "draft_bl_uploaded":
        return "📄";
      case "bl_approved":
        return "✅";
      case "requested_amendment":
        return "⚠️";
      case "amendment_accepted":
        return "✅";
      case "amendment_rejected":
        return "❌";
      case "final_bl_uploaded":
        return "📄";
      case "shipment_sailed":
        return "🚢";
      case "payment_uploaded":
        return "💳";
      case "markup_added":
        return "💰";
      default:
        return "📝";
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "quote_requested":
      case "quote_submitted":
        return "text-blue-600";
      case "quote_selected":
      case "quote_booked":
      case "bl_approved":
      case "amendment_accepted":
      case "payment_uploaded":
      case "final_bl_uploaded":
        return "text-green-600";
      case "requested_amendment":
        return "text-orange-600";
      case "amendment_rejected":
        return "text-red-600";
      case "markup_added":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "sailed":
        return "bg-blue-100 text-blue-800";
      case "loading":
        return "bg-purple-100 text-purple-800";
      case "booking":
      case "booked":
        return "bg-yellow-100 text-yellow-800";
      case "quote_confirmed":
        return "bg-indigo-100 text-indigo-800";
      case "draft_bl_uploaded":
        return "bg-orange-100 text-orange-800";
      case "final_bl_uploaded":
        return "bg-purple-100 text-purple-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchShipmentHistory}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Shipment History
        </h2>
        <button
          onClick={fetchShipmentHistory}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {shipmentHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Shipment History
          </h3>
          <p className="text-gray-500">
            Shipment history will appear here once you have shipments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {shipmentHistory.map((shipment) => (
            <div
              key={shipment.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              {/* Shipment Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Shipment #{shipment.id}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          shipment.trackingStatus
                        )}`}
                      >
                        {shipment.trackingStatus
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Commodity:</span>{" "}
                        {shipment.commodity}
                      </div>
                      <div>
                        <span className="font-medium">Container:</span>{" "}
                        {shipment.containerType}
                      </div>
                      <div>
                        <span className="font-medium">Mode:</span>{" "}
                        {shipment.mode}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span>{" "}
                        {shipment.finalPrice
                          ? `$${shipment.finalPrice}`
                          : "N/A"}
                      </div>
                    </div>
                    {shipment.carrierReference && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Carrier Ref:</span>{" "}
                        {shipment.carrierReference}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleShipmentExpansion(shipment.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                  >
                    {expandedShipments.has(shipment.id) ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Shipment Logs */}
              {expandedShipments.has(shipment.id) && (
                <div className="p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Activity Timeline
                  </h4>
                  <div className="space-y-4">
                    {shipment.logs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No activity logs available
                      </p>
                    ) : (
                      shipment.logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            <span className="text-lg">
                              {getActionIcon(log.action)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm font-medium ${getActionColor(
                                  log.action
                                )}`}
                              >
                                {log.action.replace("_", " ").toUpperCase()}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.details}
                            </p>
                            {log.actor && (
                              <p className="text-xs text-gray-500 mt-1">
                                By: {log.actor}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
