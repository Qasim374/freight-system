import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isClientRole } from "@/lib/auth-utils";

export default async function ClientDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Client Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Active Shipments
            </h3>
            <p className="text-3xl font-bold text-blue-600">5</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pending Quotes
            </h3>
            <p className="text-3xl font-bold text-yellow-600">3</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Completed
            </h3>
            <p className="text-3xl font-bold text-green-600">12</p>
          </div>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Recent Shipments
          </h2>
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Shipment #SH-1234
                  </h4>
                  <p className="text-sm text-gray-500">
                    20ft Container - Electronics
                  </p>
                  <p className="text-xs text-gray-400">Created: 2 days ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  In Transit
                </span>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Shipment #SH-1235
                  </h4>
                  <p className="text-sm text-gray-500">
                    40ft Container - Machinery
                  </p>
                  <p className="text-xs text-gray-400">Created: 1 week ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Delivered
                </span>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Shipment #SH-1236
                  </h4>
                  <p className="text-sm text-gray-500">
                    20ft Container - Textiles
                  </p>
                  <p className="text-xs text-gray-400">Created: 3 days ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Awaiting Quotes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
