import DashboardStats from "@/components/admin/DashboardStats";
import { getServerSession } from "next-auth";

import { db } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import { shipments, amendments, invoices } from "@/lib/schema";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.role.includes("admin")) {
    return <div>Unauthorized</div>;
  }

  // Fetch stats
  const quoteRequests = await db
    .select({ count: count() })
    .from(shipments)
    .where(eq(shipments.status, "quote_requested"));

  const pendingAmendments = await db
    .select({ count: count() })
    .from(amendments)
    .where(eq(amendments.status, "admin_review"));

  const unpaidInvoices = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.status, "unpaid"));

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Admin Dashboard
        </h1>

        <DashboardStats
          quoteRequests={quoteRequests[0].count}
          pendingAmendments={pendingAmendments[0].count}
          unpaidInvoices={unpaidInvoices[0].count}
        />

        <div className="mt-8 grid grid-cols-1 gap-6">
          {/* Recent Activity Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-800">JD</span>
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-500">
                    Approved shipment #SH-1234
                  </p>
                  <div className="mt-1 text-xs text-gray-500">2 hours ago</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-800">AS</span>
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    Alex Smith
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted a new quote request
                  </p>
                  <div className="mt-1 text-xs text-gray-500">4 hours ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Performance Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Top Vendors
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <span className="text-gray-700">VT</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Vendor Tech
                    </p>
                    <p className="text-xs text-gray-500">Win rate: 78%</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  24 quotes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <span className="text-gray-700">LS</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Logistics Solutions
                    </p>
                    <p className="text-xs text-gray-500">Win rate: 65%</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  18 quotes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
