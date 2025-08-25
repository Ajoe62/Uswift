export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-uswift-navy text-white flex flex-col p-6">
      <h2 className="font-bold text-lg mb-8">Dashboard</h2>
      <nav className="flex flex-col gap-4">
        <a href="/dashboard" className="hover:text-uswift-blue">
          Overview
        </a>
        <a href="/dashboard/jobs" className="hover:text-uswift-blue">
          Jobs
        </a>
        <a href="/dashboard/profile" className="hover:text-uswift-blue">
          Profile
        </a>
        <a href="/dashboard/settings" className="hover:text-uswift-blue">
          Settings
        </a>
      </nav>
    </aside>
  );
}
