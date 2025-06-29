"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import VendorBLTable from "@/components/vendor/VendorBLTable";
import BLUploadModal from "@/components/vendor/BLUploadModal";

interface WonShipment {
  id: string;
  containerType: string;
  commodity: string;
  origin: string;
  destination: string;
  status: string;
  cost: string;
  sailingDate: string;
  carrierName: string;
  draftBl?: string;
  finalBl?: string;
}

export default function VendorBLsPage() {
  const { data: session } = useSession();
  const [wonShipments, setWonShipments] = useState<WonShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<WonShipment | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blType, setBlType] = useState<"draft" | "final">("draft");

  useEffect(() => {
    const fetchWonShipments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/vendor/won-shipments", {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setWonShipments(data.shipments || []);
        }
      } catch (error) {
        console.error("Error fetching won shipments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchWonShipments();
    }
  }, [session]);

  const handleUploadBL = (shipment: WonShipment, type: "draft" | "final") => {
    setSelectedShipment(shipment);
    setBlType(type);
    setIsModalOpen(true);
  };

  const handleBLUploaded = () => {
    setIsModalOpen(false);
    setSelectedShipment(null);
    // Refresh the shipments
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BL Management</h1>
          <p className="text-gray-600 mt-2">
            Upload bills of lading for your won shipments
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Won Shipments ({wonShipments.length})
            </h2>
          </div>

          <VendorBLTable shipments={wonShipments} onUploadBL={handleUploadBL} />
        </div>

        {selectedShipment && (
          <BLUploadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            shipment={selectedShipment}
            blType={blType}
            onBLUploaded={handleBLUploaded}
          />
        )}
      </div>
    </div>
  );
}
