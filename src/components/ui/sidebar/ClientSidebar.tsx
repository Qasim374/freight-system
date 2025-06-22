"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlusCircleIcon,
  TruckIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function ClientSidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/client/dashboard", icon: HomeIcon },
    {
      name: "Quote Requests",
      href: "/client/quotes",
      icon: ClipboardDocumentListIcon,
    },
    { name: "New Quote", href: "/client/quotes/new", icon: PlusCircleIcon },
    {
      name: "Active Shipments",
      href: "/client/active-shipments",
      icon: TruckIcon,
    },
    { name: "Shipments", href: "/client/shipments", icon: DocumentTextIcon },
    { name: "Invoices", href: "/client/invoices", icon: CurrencyDollarIcon },
    {
      name: "Shipment History",
      href: "/client/shipment-history",
      icon: ChartBarIcon,
    },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
          <div className="text-white font-bold text-xl">Client Portal</div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    pathname === item.href
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-300"
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
