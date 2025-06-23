import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import ShipmentNavigation from "@/components/client/ShipmentNavigation";

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
        <ShipmentNavigation shipmentId={params.id} />
      </div>
    </div>
  );
}
