import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import ShipmentTracking from "@/components/client/ShipmentTracking";

interface ShipmentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ShipmentDetailPage({
  params,
}: ShipmentDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Shipment #{params.id.substring(0, 8)}
          </h1>
          <p className="text-gray-600 mt-1">
            Track your shipment progress and status
          </p>
        </div>

        <ShipmentTracking shipmentId={params.id} />
      </div>
    </div>
  );
}
