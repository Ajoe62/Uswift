import Image from "next/image";
import DashboardStats from "@/components/DashboardStats";

export default function DashboardHome() {
  return (
    <section className="p-6">
      <header className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full overflow-hidden shadow">
          <Image src="/icon128.png" alt="Uswift logo" width={56} height={56} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-gray-600">
            Quick overview of your job search and stats
          </p>
        </div>
      </header>

      <DashboardStats />
    </section>
  );
}
