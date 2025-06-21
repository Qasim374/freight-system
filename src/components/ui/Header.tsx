"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Royal Gulf Freight System
              </h1>
            </div>
          </div>
          <div className="ml-4 flex items-center md:ml-6">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-700">
                  {session?.user?.email}
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-300"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
