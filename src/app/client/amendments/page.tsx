import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isClientRole } from "@/lib/auth-utils";
import ClientAmendmentsTable from "@/components/client/ClientAmendmentsTable";

export default async function ClientAmendmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isClientRole(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Amendment Requests
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage your amendment requests and vendor responses
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <ClientAmendmentsTable />
        </div>
      </div>
    </div>
  );
}
