import InvoiceTable from "@/components/admin/InvoiceTable";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function InvoiceManagement() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.role.includes("admin")) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Invoice Management
          </h1>
          <div className="flex space-x-3">
            <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">
              Generate Reports
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <InvoiceTable />
        </div>
      </div>
    </div>
  );
}
