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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 animate-pulse rounded-lg shadow p-6"
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading statistics: {error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-uswift-blue text-white rounded-lg shadow p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-lg mb-2">Total Applications</h4>
        <span className="text-3xl font-bold">
          {stats?.totalApplications || 0}
        </span>
        <p className="text-sm opacity-80 mt-1">
          {stats?.thisMonthApplications || 0} this month
        </p>
      </div>

      <div className="bg-uswift-accent text-white rounded-lg shadow p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-lg mb-2">Interviews</h4>
        <span className="text-3xl font-bold">{stats?.interviews || 0}</span>
        <p className="text-sm opacity-80 mt-1">
          {stats?.totalApplications
            ? `${((stats.interviews / stats.totalApplications) * 100).toFixed(
                1
              )}% interview rate`
            : "No applications yet"}
        </p>
      </div>

      <div className="bg-uswift-navy text-white rounded-lg shadow p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-lg mb-2">Offers</h4>
        <span className="text-3xl font-bold">{stats?.offers || 0}</span>
        <p className="text-sm opacity-80 mt-1">
          {stats?.successRate || 0}% success rate
        </p>
      </div>
    </div>
  );
}
