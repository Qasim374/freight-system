import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import ShipmentHistoryTab from "@/components/client/ShipmentHistoryTab";

export default async function ShipmentHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Shipment History</h1>
          <p className="text-gray-600 mt-1">
            View complete audit trail and timeline for all your shipments
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <ShipmentHistoryTab />
        </div>
      </div>
    </div>
  );
}
