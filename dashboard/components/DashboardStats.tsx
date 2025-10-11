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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-md p-6 card-blue-frame">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <h4 className="font-semibold text-sm text-gray-500 mb-1">
          Total Applications
        </h4>
        <span className="text-3xl font-bold text-gray-900">
          {stats?.totalApplications || 0}
        </span>
        <p className="text-sm text-gray-600 mt-2">
          {stats?.thisMonthApplications || 0} this month
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 card-blue-frame">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>
        <h4 className="font-semibold text-sm text-gray-500 mb-1">
          Interviews
        </h4>
        <span className="text-3xl font-bold text-gray-900">
          {stats?.interviews || 0}
        </span>
        <p className="text-sm text-gray-600 mt-2">
          {stats?.totalApplications
            ? `${((stats.interviews / stats.totalApplications) * 100).toFixed(
                1
              )}% interview rate`
            : "No applications yet"}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 card-blue-frame">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>
        <h4 className="font-semibold text-sm text-gray-500 mb-1">
          Offers
        </h4>
        <span className="text-3xl font-bold text-gray-900">
          {stats?.offers || 0}
        </span>
        <p className="text-sm text-gray-600 mt-2">
          {stats?.successRate || 0}% success rate
        </p>
      </div>
    </div>
  );
}