import React from "react";
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const DashboardStats = ({
  quoteRequests,
  pendingAmendments,
  unpaidInvoices,
}: {
  quoteRequests: number;
  pendingAmendments: number;
  unpaidInvoices: number;
}) => {
  const stats = [
    {
      id: 1,
      name: "New Quote Requests",
      value: quoteRequests,
      icon: ChartBarIcon,
      change: "12%",
      changeType: "increase",
    },
    {
      id: 2,
      name: "Pending Amendments",
      value: pendingAmendments,
      icon: ClockIcon,
      change: "5%",
      changeType: "increase",
    },
    {
      id: 3,
      name: "Unpaid Invoices",
      value: unpaidInvoices,
      icon: CurrencyDollarIcon,
      change: "3%",
      changeType: "decrease",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon
                  className="h-6 w-6 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span
                className={`font-medium ${
                  stat.changeType === "increase"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change}
              </span>{" "}
              from last week
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
