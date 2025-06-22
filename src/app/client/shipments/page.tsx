import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import ClientShipmentTable from "@/components/client/ClientShipmentTable";

export default async function ClientShipmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
            <p className="text-gray-600 mt-1">
              Track all your shipments from quote to delivery
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ClientShipmentTable clientId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
