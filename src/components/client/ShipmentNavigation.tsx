"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ShipmentNavigationProps {
  shipmentId: string;
}

export default function ShipmentNavigation({
  shipmentId,
}: ShipmentNavigationProps) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchShipmentData = async () => {
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
          const shipmentStatus = data.shipment.shipmentStatus;
          const trackingStatus = data.shipment.trackingStatus;

          // Immediate redirect based on status
          if (
            ["draft_bl_uploaded", "final_bl_uploaded"].includes(shipmentStatus)
          ) {
            router.push(`/client/shipments/${shipmentId}/bl-workflow`);
          } else if (
            ["loading", "sailed", "delivered", "in_transit"].includes(
              trackingStatus
            )
          ) {
            router.push(`/client/shipments/${shipmentId}/tracking`);
          } else {
            // Default to tracking page for other statuses
            router.push(`/client/shipments/${shipmentId}/tracking`);
          }
        } else {
          // If API fails, redirect to tracking page as fallback
          router.push(`/client/shipments/${shipmentId}/tracking`);
        }
      } catch (error) {
        console.error("Failed to fetch shipment data:", error);
        // Fallback redirect
        router.push(`/client/shipments/${shipmentId}/tracking`);
      }
    };

    if (session?.user?.id && shipmentId) {
      fetchShipmentData();
    }
  }, [session, shipmentId, router]);

  // Show minimal loading while redirecting
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <p className="ml-3 text-gray-600">Loading shipment details...</p>
    </div>
  );
}
