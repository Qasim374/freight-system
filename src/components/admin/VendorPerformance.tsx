"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import VendorDetailsModal from "./VendorDetailsModal";

interface VendorStats {
  vendorWinRates: Array<{
    company: string;
    winRate: number;
  }>;
  topVendors: Array<{
    id: number;
    company: string;
    quoteCount: number;
    winRate: number;
    avgBidGap?: number;
  }>;
}

export default function VendorPerformance() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/vendors");
        const data = await response.json();

        if (response.ok) {
          setStats(data);
        } else {
          setError(data.error || "Failed to fetch vendor stats");
        }
      } catch (error) {
        console.error("Error fetching vendor stats:", error);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleViewDetails = (vendorId: number) => {
    setSelectedVendorId(vendorId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVendorId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-12">No data available</div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Vendor Performance
      </h2>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-2 text-gray-800">
          Win Rate by Vendor
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.vendorWinRates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Win Rate"]}
              />
              <Legend />
              <Bar dataKey="winRate" fill="#0ea5e9" name="Win Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-2">Top Vendors</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Bid Gap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vendor.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.quoteCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.winRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.avgBidGap?.toFixed(1) || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(vendor.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <VendorDetailsModal
        vendorId={selectedVendorId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
