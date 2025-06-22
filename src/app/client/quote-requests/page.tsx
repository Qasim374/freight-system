import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import RequestQuoteTab from "@/components/client/RequestQuoteTab";

export default async function QuoteRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-gray-600 mt-1">
            Manage your shipping quote requests and vendor responses
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <RequestQuoteTab />
        </div>
      </div>
    </div>
  );
}
