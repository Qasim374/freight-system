"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardStats from "@/components/client/DashboardStats";
import RecentShipments from "@/components/client/RecentShipments";
import AmendmentNotifications from "@/components/client/AmendmentNotifications";
import QuoteNotifications from "@/components/client/QuoteNotifications";

interface DashboardData {
  quoteRequests: number;
  pendingBLs: number;
  unpaidInvoices: number;
  pendingAmendments: number;
}

interface Quote {
  id: number;
  status: string;
  containerType: string;
  commodity: string;
  numContainers: number;
  shipmentDate: string;
  createdAt: string;
  finalPrice: string | null;
  mode: string;
  weightPerContainer: string | null;
  collectionAddress: string | null;
  bidCount: number;
}

interface Shipment {
  id: number;
  shipmentStatus: string;
  trackingStatus: string;
  carrierReference: string | null;
  eta: string | null;
  createdAt: string;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<DashboardData>({
    quoteRequests: 0,
    pendingBLs: 0,
    unpaidInvoices: 0,
    pendingAmendments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard data
        const dashboardResponse = await fetch("/api/client/dashboard", {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          setStats({
            quoteRequests: dashboardData.quoteRequests,
            pendingBLs: dashboardData.pendingBLs,
            unpaidInvoices: dashboardData.unpaidInvoices,
            pendingAmendments: dashboardData.pendingAmendments,
          });
          setQuotes(dashboardData.recentQuotes || []);
          setShipments(dashboardData.recentShipments || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user?.email}
          </p>
        </div>

        {/* Quote Notifications */}
        <QuoteNotifications />

        {/* Amendment Notifications */}
        <AmendmentNotifications />

        {/* Stats */}
        <DashboardStats
          quoteRequests={stats.quoteRequests}
          pendingBLs={stats.pendingBLs}
          unpaidInvoices={stats.unpaidInvoices}
          pendingAmendments={stats.pendingAmendments}
        />

        {/* Recent Quotes */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Quote Requests
              </h2>
            </div>
            <div className="p-6">
              {quotes.length > 0 ? (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {quote.commodity} - {quote.numContainers}x{" "}
                            {quote.containerType}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Mode: {quote.mode} | Shipment Date:{" "}
                            {new Date(quote.shipmentDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Status: {quote.status.replace("_", " ")} | Bids:{" "}
                            {quote.bidCount}
                          </p>
                        </div>
                        <Link
                          href={`/client/quotes/${quote.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent quote requests
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="mt-8">
          <RecentShipments shipments={shipments} />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/client/quotes/new"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Request Quote
                </h3>
                <p className="text-gray-500">
                  Create a new shipping quote request
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/client/quotes"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  View Quotes
                </h3>
                <p className="text-gray-500">
                  Check your quote requests and responses
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
