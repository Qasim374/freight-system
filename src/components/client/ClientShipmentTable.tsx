"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Shipment {
  id: number;
  shipmentStatus: string;
  trackingStatus: string;
  carrierReference: string | null;
  eta: string | null;
  createdAt: string;
}

interface ClientShipmentTableProps {
  clientId: string;
}

export default function ClientShipmentTable({
  clientId,
}: ClientShipmentTableProps) {
  const { data: session } = useSession();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await fetch(`/api/client/shipments`, {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Filter to show only active shipments
          const activeShipments = (data.shipments || []).filter(
            (shipment: Shipment) =>
              shipment.shipmentStatus !== "booked" ||
              shipment.trackingStatus !== "quote_confirmed"
          );
          setShipments(activeShipments);
        } else {
          setError("Failed to load shipments");
        }
      } catch {
        setError("An error occurred while loading shipments");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchShipments();
    }
  }, [session, clientId]);

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
      case "quote_confirmed":
        return "QUOTE CONFIRMED";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No active shipments found</p>
        <p className="text-gray-400 text-sm mb-4">
          Shipments will appear here once they are booked and in progress
        </p>
        <Link
          href="/client/quotes"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
        >
          View Quote Requests
        </Link>
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
              Carrier Reference
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shipment Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tracking Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ETA
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
                #{shipment.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {shipment.carrierReference || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    shipment.shipmentStatus
                  )}`}
                >
                  {getStatusLabel(shipment.shipmentStatus)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrackingStatusColor(
                    shipment.trackingStatus
                  )}`}
                >
                  {getTrackingStatusLabel(shipment.trackingStatus)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {shipment.eta ? formatDate(shipment.eta) : "TBD"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {/* Conditional buttons based on status */}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
