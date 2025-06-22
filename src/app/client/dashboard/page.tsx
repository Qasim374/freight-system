import DashboardStats from "@/components/client/DashboardStats";
import RecentShipments from "@/components/client/RecentShipments";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default async function ClientDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  try {
    // Fetch data from API
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/client/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Pass session info in headers for server-side API calls
        "x-user-id": session.user.id,
        "x-user-role": session.user.role,
      },
      // Disable cache to ensure fresh data
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Client Dashboard
          </h1>

          <DashboardStats
            quoteRequests={data.quoteRequests}
            pendingBLs={data.pendingBLs}
            unpaidInvoices={data.unpaidInvoices}
          />

          <div className="mt-8 grid grid-cols-1 gap-6">
            <RecentShipments shipments={data.recentShipments} />

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/client/quotes/new"
                  className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center"
                >
                  <PlusCircleIcon className="h-8 w-8 mx-auto text-blue-600" />
                  <p className="mt-2 font-medium text-blue-900">
                    Request Quote
                  </p>
                </Link>
                <Link
                  href="/client/shipments"
                  className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center"
                >
                  <TruckIcon className="h-8 w-8 mx-auto text-green-600" />
                  <p className="mt-2 font-medium text-green-900">
                    Track Shipment
                  </p>
                </Link>
                <Link
                  href="/client/bls"
                  className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center"
                >
                  <DocumentTextIcon className="h-8 w-8 mx-auto text-yellow-600" />
                  <p className="mt-2 font-medium text-yellow-900">Review BL</p>
                </Link>
                <Link
                  href="/client/invoices"
                  className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center"
                >
                  <CurrencyDollarIcon className="h-8 w-8 mx-auto text-purple-600" />
                  <p className="mt-2 font-medium text-purple-900">
                    Pay Invoice
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}
