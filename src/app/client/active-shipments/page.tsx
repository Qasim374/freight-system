import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import ActiveShipmentsTab from "@/components/client/ActiveShipmentsTab";

export default async function ActiveShipmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Active Shipments</h1>
          <p className="text-gray-600 mt-1">
            Track your shipments from booking to delivery with BL workflow
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <ActiveShipmentsTab />
        </div>
      </div>
    </div>
  );
}
