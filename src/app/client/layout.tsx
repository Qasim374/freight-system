import Header from "@/components/ui/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientSidebar from "@/components/ui/sidebar/ClientSidebar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.role.includes("client")) {
    redirect("/unauthorized");
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <ClientSidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:pl-64">
        <Header />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
