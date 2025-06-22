"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { getDashboardPath } from "@/lib/auth-utils";

export default function UnauthorizedPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const getRedirectPath = () => {
    if (!session?.user?.role) return "/login";
    return getDashboardPath(session.user.role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 px-8 py-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <ShieldExclamationIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Access Denied</h2>
              <p className="text-red-100 mt-2">
                You don't have permission to access this area
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="text-center space-y-6">
              <div className="text-gray-600">
                <p className="mb-4">
                  Sorry, you don't have the required permissions to access this
                  section of the application.
                </p>
                {session?.user?.role && (
                  <p className="text-sm text-gray-500">
                    Your current role:{" "}
                    <span className="font-semibold">{session.user.role}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push(getRedirectPath())}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Go to Your Dashboard
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Royal Gulf Logistics. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
