"use client";

import { useState } from "react";
import type { JobApplication } from "@/lib/types";

type JobCardProps = {
  job: JobApplication;
  onUpdate?: (id: string, updates: Partial<JobApplication>) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
};

type EditableJobForm = {
  company_name: string;
  job_title: string;
  notes: string;
  application_url: string;
};

const statusLabels: Record<JobApplication["status"], string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const statusColors: Record<JobApplication["status"], string> = {
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-amber-100 text-amber-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString();
}

export default function JobCard({ job, onUpdate, onDelete }: JobCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditableJobForm>({
    company_name: job.company_name ?? "",
    job_title: job.job_title ?? "",
    notes: job.notes ?? "",
    application_url: job.application_url ?? "",
  });

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!onUpdate) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(job.id, editForm);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete(job.id);
  };

  const handleStatusChange = async (status: JobApplication["status"]) => {
    if (!onUpdate || status === job.status || isEditing) return;
    await onUpdate(job.id, { status });
  };

  return (
    <div
      data-animate="reveal"
      className="card bg-white text-black rounded-lg shadow p-4 sm:p-6 mb-4 card-magic card-magic--glow transform-gpu hover:-translate-y-1 hover:shadow-lg transition"
      role="article"
      aria-labelledby={`job-${job.id}-title`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex-1 w-full">
          {isEditing ? (
            <div className="space-y-3">
              <label className="sr-only" htmlFor={`company-${job.id}`}>
                Company Name
              </label>
              <input
                id={`company-${job.id}`}
                type="text"
                value={editForm.company_name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, company_name: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Company Name"
              />
              <label className="sr-only" htmlFor={`title-${job.id}`}>
                Job Title
              </label>
              <input
                id={`title-${job.id}`}
                type="text"
                value={editForm.job_title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, job_title: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Job Title"
              />
              <label className="sr-only" htmlFor={`notes-${job.id}`}>
                Notes
              </label>
              <textarea
                id={`notes-${job.id}`}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Notes"
                rows={3}
              />
              <label className="sr-only" htmlFor={`url-${job.id}`}>
                Application URL
              </label>
              <input
                id={`url-${job.id}`}
                type="url"
                value={editForm.application_url}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, application_url: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Application URL"
              />
            </div>
          ) : (
            <>
              <h4 id={`job-${job.id}-title`} className="font-bold text-lg sm:text-xl text-gray-900">
                {job.job_title}
              </h4>
              <p className="text-gray-600 text-base sm:text-lg">{job.company_name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}
                >
                  {statusLabels[job.status]}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  Applied: {formatDate(job.applied_date)}
                </span>
              </div>
              {job.notes && <p className="text-gray-700 mt-2 text-xs sm:text-sm">{job.notes}</p>}
              {job.application_url && (
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm mt-1 inline-block"
                >
                  View Application →
                </a>
              )}
            </>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
          <div
            className="flex flex-wrap gap-1 justify-start sm:justify-end"
            role="group"
            aria-label="Quick status actions"
          >
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status as JobApplication["status"])}
                className={`px-2 py-1 text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  job.status === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                disabled={isEditing || isSaving}
                aria-pressed={job.status === status}
                title={label}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-start sm:justify-end">
            <button
              type="button"
              onClick={handleEdit}
              className="px-3 py-1 text-xs sm:text-sm rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1 text-xs sm:text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
              disabled={isSaving}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
