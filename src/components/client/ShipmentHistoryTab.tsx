"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface AuditLogDetails {
  description?: string;
  amount?: number;
  reason?: string;
  carrierReference?: string;
  extraCost?: number;
  delayDays?: number;
}

interface AuditLog {
  id: number;
  shipmentId: number;
  action: string;
  details: AuditLogDetails;
  timestamp: string;
  actorId: number;
  actorName?: string;
}

interface ShipmentHistory {
  id: number;
  commodity: string;
  containerType: string;
  status: string;
  createdAt: string;
  auditLogs: AuditLog[];
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
      case "quote_received":
        return "📨";
      case "quote_confirmed":
        return "✅";
      case "shipment_booked":
        return "🚢";
      case "draft_bl_uploaded":
        return "📄";
      case "bl_approved":
        return "✅";
      case "amendment_requested":
        return "⚠️";
      case "amendment_accepted":
        return "✅";
      case "amendment_rejected":
        return "❌";
      case "invoice_generated":
        return "💰";
      case "payment_received":
        return "💳";
      case "shipment_delivered":
        return "🎉";
      default:
        return "📝";
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "quote_requested":
      case "quote_received":
        return "text-blue-600";
      case "quote_confirmed":
      case "shipment_booked":
      case "bl_approved":
      case "amendment_accepted":
      case "payment_received":
      case "shipment_delivered":
        return "text-green-600";
      case "amendment_requested":
        return "text-orange-600";
      case "amendment_rejected":
        return "text-red-600";
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
      case "draft_bl":
        return "bg-orange-100 text-orange-800";
      case "final_bl":
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
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Shipment History
          </h3>
          <p className="text-gray-500">
            Shipment history will appear here once you have completed shipments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {shipmentHistory.map((shipment) => {
            const isExpanded = expandedShipments.has(shipment.id);

            return (
              <div
                key={shipment.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Shipment Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        #{shipment.id}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          shipment.status
                        )}`}
                      >
                        {shipment.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleShipmentExpansion(shipment.id)}
                      className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {shipment.commodity} • {shipment.containerType} • Created{" "}
                    {formatDate(shipment.createdAt)}
                  </div>
                </div>

                {/* Audit Timeline */}
                {isExpanded && (
                  <div className="p-6">
                    {shipment.auditLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No audit logs available for this shipment
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {shipment.auditLogs.map((log, index) => (
                          <div
                            key={`${shipment.id}-${log.id}-${index}`}
                            className="relative flex items-start mb-6 last:mb-0"
                          >
                            {/* Timeline dot */}
                            <div className="absolute left-4 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-sm">
                                {getActionIcon(log.action)}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="ml-12 flex-1">
                              <div
                                className={`font-medium ${getActionColor(
                                  log.action
                                )}`}
                              >
                                {log.action.replace(/_/g, " ").toUpperCase()}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {log.details?.description || "Action performed"}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {formatDate(log.timestamp)}
                                {log.actorName && ` • by ${log.actorName}`}
                              </div>

                              {/* Additional details */}
                              {log.details && (
                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                                  {log.details.amount && (
                                    <div>Amount: ${log.details.amount}</div>
                                  )}
                                  {log.details.reason && (
                                    <div>Reason: {log.details.reason}</div>
                                  )}
                                  {log.details.carrierReference && (
                                    <div>
                                      Carrier Ref:{" "}
                                      {log.details.carrierReference}
                                    </div>
                                  )}
                                  {log.details.extraCost && (
                                    <div>
                                      Extra Cost: ${log.details.extraCost}
                                    </div>
                                  )}
                                  {log.details.delayDays && (
                                    <div>
                                      Delay: {log.details.delayDays} days
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
