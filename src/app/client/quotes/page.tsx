import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import RequestQuoteTab from "@/components/client/RequestQuoteTab";
import Link from "next/link";

export default async function ClientQuotesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
            <p className="text-gray-600 mt-1">
              Manage your shipping quote requests and vendor responses
            </p>
          </div>
          <Link
            href="/client/quotes/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            New Quote Request
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg">
          <RequestQuoteTab />
        </div>
      </div>
    </div>
  );
}
