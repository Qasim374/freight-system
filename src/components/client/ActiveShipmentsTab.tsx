"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ActiveShipment {
  id: number;
  shipmentStatus: string;
  trackingStatus: string;
  carrierReference: string | null;
  eta: string | null;
  createdAt: string;
}

export default function ActiveShipmentsTab() {
  const { data: session } = useSession();
  const [activeShipments, setActiveShipments] = useState<ActiveShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveShipments = async () => {
      try {
        const response = await fetch("/api/client/shipments", {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Filter to show only active shipments (booked and beyond)
          const active = (data.shipments || []).filter(
            (shipment: ActiveShipment) =>
              shipment.shipmentStatus !== "booked" ||
              shipment.trackingStatus !== "quote_confirmed"
          );
          setActiveShipments(active);
        }
      } catch (error) {
        console.error("Failed to fetch active shipments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchActiveShipments();
    }
  }, [session]);

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
      case "booking":
        return "bg-green-100 text-green-800";
      case "loading":
        return "bg-blue-100 text-blue-800";
      case "sailed":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "booked":
        return "BOOKED";
      case "draft_bl_uploaded":
        return "DRAFT BL UPLOADED";
      case "final_bl_uploaded":
        return "FINAL BL UPLOADED";
      case "in_transit":
        return "IN TRANSIT";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  const getTrackingStatusLabel = (status: string) => {
    switch (status) {
      case "booking":
        return "BOOKING";
      case "loading":
        return "LOADING";
      case "sailed":
        return "SAILED";
      case "delivered":
        return "DELIVERED";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Active Shipments
        </h2>
      </div> */}

      {activeShipments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🚢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Shipments
          </h3>
          <p className="text-gray-500 mb-6">
            Your active shipments will appear here once they are booked.
          </p>
          <Link
            href="/client/quotes"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
          >
            View Quote Requests
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeShipments.map((shipment) => (
            <div
              key={shipment.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      #{shipment.id}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        shipment.shipmentStatus
                      )}`}
                    >
                      {getStatusLabel(shipment.shipmentStatus)}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrackingStatusColor(
                        shipment.trackingStatus
                      )}`}
                    >
                      {getTrackingStatusLabel(shipment.trackingStatus)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Carrier Ref:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {shipment.carrierReference || "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">ETA:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(shipment.eta)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(shipment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  {/* Conditional navigation based on status */}
                  {["draft_bl_uploaded", "final_bl_uploaded"].includes(
                    shipment.shipmentStatus
                  ) ? (
                    <Link
                      href={`/client/shipments/${shipment.id}/bl-workflow`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Manage BL Workflow
                    </Link>
                  ) : (
                    <Link
                      href={`/client/shipments/${shipment.id}/tracking`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Track Shipment
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
