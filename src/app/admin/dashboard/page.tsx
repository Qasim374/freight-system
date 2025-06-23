import DashboardStatsClient from "@/components/admin/DashboardStatsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdminRole } from "@/lib/auth-utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user?.email}
          </p>
        </div>

        {/* Stats Overview */}
        <DashboardStatsClient />

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/quotes"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Quote Management
                </h3>
                <p className="text-sm text-gray-500">
                  Review and approve vendor quotes
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/amendments"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Amendment Review
                </h3>
                <p className="text-sm text-gray-500">
                  Review cost changes and delays
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/bl-approvals"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-100 p-3 rounded-full">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  BL Approvals
                </h3>
                <p className="text-sm text-gray-500">Approve bills of lading</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/invoices"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Invoice Engine
                </h3>
                <p className="text-sm text-gray-500">
                  Manage invoices and payments
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity and Performance */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-yellow-800">VT</span>
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    Vendor Tech
                  </p>
                  <p className="text-sm text-gray-500">
                    Uploaded draft BL for SH-5678
                  </p>
                  <div className="mt-1 text-xs text-gray-500">6 hours ago</div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <span className="text-gray-700">GF</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Global Freight
                    </p>
                    <p className="text-xs text-gray-500">Win rate: 72%</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  15 quotes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            System Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-xs text-gray-500">Connected</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  API Services
                </p>
                <p className="text-xs text-gray-500">Operational</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  File Storage
                </p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
