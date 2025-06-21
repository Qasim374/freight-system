import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Analytics() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.role.includes("admin")) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          System Analytics
        </h1>

        <div className="bg-white shadow rounded-lg p-6">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
