"use client";

import { useState, useEffect } from "react";
import type { JobApplication } from "@/lib/types";
import JobCard from "@/components/JobCard";
import JobApplicationForm from "@/components/JobApplicationForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | JobApplication["status"]>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/jobs");
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data: JobApplication[] = await response.json();
      setJobs(data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (
    jobData: Omit<
      JobApplication,
      "id" | "user_id" | "created_at" | "updated_at"
    >
  ) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error("Failed to add job application");
      }

      const newJob: JobApplication = await response.json();
      setJobs((prev) => [newJob, ...prev]);
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding job:", err);
      setError(err instanceof Error ? err.message : "Failed to add job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateJob = async (
    jobId: string,
    updates: Partial<JobApplication>
  ) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update job");
      }

      const updatedJob: JobApplication = await response.json();
      setJobs((prev) =>
        prev.map((job) => (job.id === jobId ? updatedJob : job))
      );
    } catch (err) {
      console.error("Error updating job:", err);
      setError(err instanceof Error ? err.message : "Failed to update job");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (err) {
      console.error("Error deleting job:", err);
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  // Filter and search jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === "all" || job.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: jobs.length,
    applied: jobs.filter((job) => job.status === "applied").length,
    interview: jobs.filter((job) => job.status === "interview").length,
    offer: jobs.filter((job) => job.status === "offer").length,
    rejected: jobs.filter((job) => job.status === "rejected").length,
    withdrawn: jobs.filter((job) => job.status === "withdrawn").length,
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">Job Applications</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg p-6">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Job Applications</h2>
        <Button onClick={() => setShowAddForm(true)}>
          Add New Application
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by company or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {Object.entries({
              all: "All",
              applied: "Applied",
              interview: "Interview",
              offer: "Offer",
              rejected: "Rejected",
              withdrawn: "Withdrawn",
            }).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label} ({statusCounts[status as keyof typeof statusCounts]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {jobs.length === 0
                ? "No job applications yet"
                : "No applications match your filters"}
            </h3>
            <p className="text-gray-500 mb-4">
              {jobs.length === 0
                ? "Start by adding your first job application"
                : "Try adjusting your search or filter criteria"}
            </p>
            {jobs.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                Add Your First Application
              </Button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onUpdate={handleUpdateJob}
              onDelete={handleDeleteJob}
            />
          ))
        )}
      </div>

      {/* Add Job Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title=""
      >
        <JobApplicationForm
          onSubmit={handleAddJob}
          onCancel={() => setShowAddForm(false)}
          isLoading={submitting}
        />
      </Modal>
    </section>
  );
}
