"use client";

import { useState, useEffect } from "react";
import type { DashboardStats as DashboardStatsType } from "@/lib/types";

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data: DashboardStatsType = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
      );
      // Fallback to demo data if API fails
      setStats({
        totalApplications: 0,
        interviews: 0,
        offers: 0,
        thisMonthApplications: 0,
        successRate: "0",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8"> {/* Changed: grid-cols-1 for mobile, sm:grid-cols-2 for tablets, md:grid-cols-3 for desktop; gap-4 for mobile, sm:gap-6 for tablets, md:gap-8 for desktop */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 animate-pulse rounded-lg shadow p-4 sm:p-6" // Changed: p-4 for mobile, sm:p-6 for larger screens
          >
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6"> {/* Changed: p-4 for mobile, sm:p-6 for larger screens */}
        <p className="text-red-800 text-sm sm:text-base"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
          Error loading statistics: {error}
        </p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm sm:text-base" // Changed: text-sm for mobile, sm:text-base for larger screens
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8"> {/* Changed: grid-cols-1 for mobile, sm:grid-cols-2 for tablets, md:grid-cols-3 for desktop; gap-4 for mobile, sm:gap-6 for tablets, md:gap-8 for desktop */}
      <div className="bg-uswift-blue text-white rounded-lg shadow p-4 sm:p-6 card-magic card-magic--glow"> {/* Changed: p-4 for mobile, sm:p-6 for larger screens */}
        <h4 className="font-bold text-base sm:text-lg mb-2"> {/* Changed: text-base for mobile, sm:text-lg for larger screens */}
          Total Applications
        </h4>
        <span className="text-2xl sm:text-3xl font-bold"> {/* Changed: text-2xl for mobile, sm:text-3xl for larger screens */}
          {stats?.totalApplications || 0}
        </span>
        <p className="text-xs sm:text-sm opacity-80 mt-1"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
          {stats?.thisMonthApplications || 0} this month
        </p>
      </div>

      <div className="bg-uswift-accent text-white rounded-lg shadow p-4 sm:p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-base sm:text-lg mb-2">
          Interviews
        </h4>
        <span className="text-2xl sm:text-3xl font-bold">
          {stats?.interviews || 0}
        </span>
        <p className="text-xs sm:text-sm opacity-80 mt-1">
          {stats?.totalApplications
            ? `${((stats.interviews / stats.totalApplications) * 100).toFixed(
                1
              )}% interview rate`
            : "No applications yet"}
        </p>
      </div>

      <div className="bg-uswift-navy text-white rounded-lg shadow p-4 sm:p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-base sm:text-lg mb-2">
          Offers
        </h4>
        <span className="text-2xl sm:text-3xl font-bold">
          {stats?.offers || 0}
        </span>
        <p className="text-xs sm:text-sm opacity-80 mt-1">
          {stats?.successRate || 0}% success rate
        </p>
      </div>
    </div>
  );
}