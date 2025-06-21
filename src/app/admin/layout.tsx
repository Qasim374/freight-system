import AdminSidebar from "@/components/ui/sidebar/AdminSidebar";
import Header from "@/components/ui/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Redirect to unauthorized if not admin
  if (!session.user.role.includes("admin")) {
    redirect("/unauthorized");
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <AdminSidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:pl-64">
        <Header />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
