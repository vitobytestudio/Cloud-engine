import { LiveProvider } from "@/lib/hooks";
import Sidebar from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LiveProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="min-h-screen px-4 py-6 sm:px-8 lg:ms-[248px]">{children}</main>
      </div>
    </LiveProvider>
  );
}
