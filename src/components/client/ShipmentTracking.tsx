"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ShipmentTrackingData {
  id: number;
  trackingStatus: string;
  shipmentStatus: string;
  carrierReference?: string;
  eta?: string;
  sailingDate?: string;
  loadingDate?: string;
  deliveredDate?: string;
  commodity: string;
  containerType: string;
  finalPrice?: number;
  origin: string;
  destination: string;
  mode: string;
}

interface ShipmentTrackingProps {
  shipmentId: string;
}

const timelineSteps = [
  {
    key: "quote_confirmed",
    label: "Quote Confirmed",
    description: "Quote has been confirmed and booking is in progress",
  },
  {
    key: "booking",
    label: "Booking",
    description: "Shipment has been booked with the carrier",
  },
  {
    key: "loading",
    label: "Loading",
    description: "Container is being loaded at origin",
  },
  {
    key: "sailed",
    label: "Sailed",
    description: "Vessel has departed from origin port",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Shipment has been delivered to destination",
  },
];

export default function ShipmentTracking({
  shipmentId,
}: ShipmentTrackingProps) {
  const { data: session } = useSession();
  const [trackingData, setTrackingData] = useState<ShipmentTrackingData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const response = await fetch(
          `/api/client/shipments/${shipmentId}/tracking`,
          {
            headers: {
              "x-user-id": session?.user?.id || "",
              "x-user-role": session?.user?.role || "",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTrackingData(data.shipment);
        } else {
          setError("Failed to load tracking data");
        }
      } catch {
        setError("An error occurred while loading tracking data");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && shipmentId) {
      fetchTrackingData();
    }
  }, [session, shipmentId]);

  const getCurrentStepIndex = (status: string) => {
    return timelineSteps.findIndex((step) => step.key === status);
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const currentIndex = getCurrentStepIndex(currentStatus);
    const stepIndex = timelineSteps.findIndex((step) => step.key === stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  if (!trackingData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tracking data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Shipment Tracking
        </h2>
        <p className="text-gray-600">
          Track your shipment&apos;s journey from {trackingData.origin} to{" "}
          {trackingData.destination}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
          <div>
            <span className="text-gray-500">Carrier Reference:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.carrierReference || "Pending"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">ETA:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formatDate(trackingData.eta)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Final Price:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.finalPrice !== undefined &&
              trackingData.finalPrice !== null
                ? `$${Number(trackingData.finalPrice).toFixed(2)}`
                : "TBD"}
            </span>
          </div>
        </div>
      </div>

      {/* Shipment Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {timelineSteps.map((step, index) => {
          const status = getStepStatus(step.key, trackingData.trackingStatus);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";

          return (
            <div
              key={step.key}
              className="relative flex items-start mb-8 last:mb-0"
            >
              {/* Timeline dot */}
              <div
                className={`absolute left-4 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="ml-12 flex-1">
                <div
                  className={`font-medium ${
                    isCompleted
                      ? "text-green-600"
                      : isCurrent
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {step.description}
                </div>
                {/* Show dates for completed steps */}
                {isCompleted && (
                  <div className="text-xs text-gray-400 mt-1">
                    {step.key === "loading" && trackingData.loadingDate && (
                      <>Loaded: {formatDate(trackingData.loadingDate)}</>
                    )}
                    {step.key === "sailed" && trackingData.sailingDate && (
                      <>Sailed: {formatDate(trackingData.sailingDate)}</>
                    )}
                    {step.key === "delivered" && trackingData.deliveredDate && (
                      <>Delivered: {formatDate(trackingData.deliveredDate)}</>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shipment Details */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Shipment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Origin:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.origin}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Destination:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.destination}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Mode:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.mode}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Commodity:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.commodity}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Container Type:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.containerType}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Shipment Status:</span>
            <span className="ml-2 font-medium text-gray-900">
              {trackingData.shipmentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
