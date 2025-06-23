import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import ShipmentTracking from "@/components/client/ShipmentTracking";
import Link from "next/link";

interface TrackingPageProps {
  params: {
    id: string;
  };
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Shipment Tracking
              </h1>
              <p className="text-gray-600 mt-1">
                Shipment #{params.id.substring(0, 8)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/client/shipments/${params.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Shipment
              </Link>
              <Link
                href={`/client/shipments/${params.id}/bl-workflow`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Manage BL Workflow
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <ShipmentTracking shipmentId={params.id} />
      </div>
    </div>
  );
}
