"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AmendmentRequestModal from "./AmendmentRequestModal";

interface BLWorkflowData {
  id: number;
  shipmentStatus: string;
  trackingStatus: string;
  hasDraftBL: boolean;
  hasFinalBL: boolean;
  draftBLUrl?: string;
  finalBLUrl?: string;
  commodity: string;
  containerType: string;
  origin: string;
  destination: string;
  mode: string;
}

interface BLWorkflowProps {
  shipmentId: string;
}

const blTimelineSteps = [
  {
    key: "booked",
    label: "Booked",
    description: "Shipment has been booked and is ready for BL preparation",
  },
  {
    key: "draft_bl_uploaded",
    label: "Draft BL",
    description: "Draft Bill of Lading has been prepared by vendor",
  },
  {
    key: "final_bl_uploaded",
    label: "Final BL",
    description: "Bill of Lading has been approved and finalized",
  },
  {
    key: "in_transit",
    label: "In Transit",
    description: "Shipment is now in transit with final BL",
  },
];

export default function BillOfLadingWorkflow({ shipmentId }: BLWorkflowProps) {
  const { data: session } = useSession();
  const [blData, setBlData] = useState<BLWorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);

  useEffect(() => {
    const fetchBLData = async () => {
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
          setBlData(data.shipment);
        } else {
          setError("Failed to load BL data");
        }
      } catch {
        setError("An error occurred while loading BL data");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && shipmentId) {
      fetchBLData();
    }
  }, [session, shipmentId]);

  const getCurrentStepIndex = (status: string) => {
    return blTimelineSteps.findIndex((step) => step.key === status);
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const currentIndex = getCurrentStepIndex(currentStatus);
    const stepIndex = blTimelineSteps.findIndex((step) => step.key === stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const handleApproveBL = async () => {
    try {
      const response = await fetch(
        `/api/client/shipments/${shipmentId}/approve-bl`,
        {
          method: "POST",
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        }
      );

      if (response.ok) {
        // Refresh BL data
        window.location.reload();
      } else {
        setError("Failed to approve Bill of Lading");
      }
    } catch {
      setError("An error occurred while approving Bill of Lading");
    }
  };

  const handleAmendmentSuccess = () => {
    // Refresh BL data after amendment request
    window.location.reload();
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

  if (!blData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No BL data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Bill of Lading Workflow
        </h2>
        <p className="text-gray-600">
          Review and approve your Bill of Lading documents for shipment from{" "}
          {blData.origin} to {blData.destination}
        </p>
      </div>

      {/* BL Actions */}
      {["draft_bl_uploaded", "final_bl_uploaded"].includes(
        blData.shipmentStatus
      ) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Bill of Lading Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            {blData.hasDraftBL && (
              <button
                onClick={() => window.open(blData.draftBLUrl, "_blank")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                View Draft BL
              </button>
            )}
            {blData.hasFinalBL && (
              <button
                onClick={() => window.open(blData.finalBLUrl, "_blank")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Final BL
              </button>
            )}
            {blData.shipmentStatus === "draft_bl_uploaded" &&
              blData.hasDraftBL && (
                <>
                  <button
                    onClick={handleApproveBL}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Approve BL
                  </button>
                  <button
                    onClick={() => setShowAmendmentModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Request Amendment
                  </button>
                </>
              )}
          </div>
        </div>
      )}

      {/* BL Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {blTimelineSteps.map((step, index) => {
          const status = getStepStatus(step.key, blData.shipmentStatus);
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
              {blData.origin}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Destination:</span>
            <span className="ml-2 font-medium text-gray-900">
              {blData.destination}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Mode:</span>
            <span className="ml-2 font-medium text-gray-900">
              {blData.mode}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Commodity:</span>
            <span className="ml-2 font-medium text-gray-900">
              {blData.commodity}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Container Type:</span>
            <span className="ml-2 font-medium text-gray-900">
              {blData.containerType}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Shipment Status:</span>
            <span className="ml-2 font-medium text-gray-900">
              {blData.shipmentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Amendment Request Modal */}
      <AmendmentRequestModal
        shipmentId={shipmentId}
        isOpen={showAmendmentModal}
        onClose={() => setShowAmendmentModal(false)}
        onSuccess={handleAmendmentSuccess}
      />
    </div>
  );
}
