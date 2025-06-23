"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardStats from "@/components/client/DashboardStats";
import RecentShipments from "@/components/client/RecentShipments";
import AmendmentNotifications from "@/components/client/AmendmentNotifications";

interface DashboardData {
  quoteRequests: number;
  pendingBLs: number;
  unpaidInvoices: number;
}

interface Shipment {
  id: string;
  status: string;
  containerType: string;
  commodity: string;
  numberOfContainers: number;
  preferredShipmentDate: string;
  createdAt: string;
  quoteDeadline?: string;
  quoteRequestedAt?: string;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<DashboardData>({
    quoteRequests: 0,
    pendingBLs: 0,
    unpaidInvoices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch shipments
        const shipmentsResponse = await fetch("/api/client/shipments", {
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-role": session?.user?.role || "",
          },
        });

        let shipmentsData: { shipments: Shipment[] } = { shipments: [] };
        if (shipmentsResponse.ok) {
          shipmentsData = await shipmentsResponse.json();
          setShipments(shipmentsData.shipments || []);
        }

        // Count quote requests (shipments with quote_requested status)
        const quoteRequests = (shipmentsData.shipments || []).filter(
          (shipment: Shipment) => shipment.status === "quote_requested"
        ).length;

        // Count pending BLs (shipments with draft_bl status)
        const pendingBLs = (shipmentsData.shipments || []).filter(
          (shipment: Shipment) => shipment.status === "draft_bl"
        ).length;

        // Count unpaid invoices (this would need an invoices API)
        const unpaidInvoices = 0; // TODO: Implement invoices API

        setStats({
          quoteRequests,
          pendingBLs,
          unpaidInvoices,
        });
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

        {/* Amendment Notifications */}
        <AmendmentNotifications />

        {/* Stats */}
        <DashboardStats
          quoteRequests={stats.quoteRequests}
          pendingBLs={stats.pendingBLs}
          unpaidInvoices={stats.unpaidInvoices}
        />

        {/* Recent Shipments */}
        <div className="mt-8">
          <RecentShipments shipments={shipments} />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link
            href="/client/quotes/new"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
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
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
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

          <Link
            href="/client/shipments"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">🚢</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Track Shipments
                </h3>
                <p className="text-gray-500">Monitor your active shipments</p>
              </div>
            </div>
          </Link>

          <Link
            href="/client/amendments"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Amendments
                </h3>
                <p className="text-gray-500">Manage amendment requests</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
