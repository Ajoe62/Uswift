"use client";

import { useState } from "react";
import { JobApplication } from "@/lib/types";
import Button from "@/components/ui/Button";

interface JobCardProps {
  job: JobApplication;
  onUpdate: (jobId: string, updates: Partial<JobApplication>) => void;
  onDelete: (jobId: string) => void;
}

const statusColors = {
  applied: "bg-blue-100 text-blue-800",
  interview: "bg-yellow-100 text-yellow-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function JobCard({ job, onUpdate, onDelete }: JobCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    company_name: job.company_name,
    job_title: job.job_title,
    status: job.status,
    notes: job.notes || "",
    application_url: job.application_url || "",
  });

  const handleStatusChange = (newStatus: JobApplication["status"]) => {
    onUpdate(job.id, { status: newStatus });
  };

  const handleEdit = () => {
    if (isEditing) {
      onUpdate(job.id, editForm);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      onDelete(job.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white text-black rounded-lg shadow p-6 mb-4 card-magic card-magic--glow hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.company_name}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded"
                placeholder="Company Name"
              />
              <input
                type="text"
                value={editForm.job_title}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    job_title: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded"
                placeholder="Job Title"
              />
              <textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Notes"
                rows={3}
              />
              <input
                type="url"
                value={editForm.application_url}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    application_url: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded"
                placeholder="Application URL"
              />
            </div>
          ) : (
            <>
              <h4 className="font-bold text-xl text-gray-900">
                {job.job_title}
              </h4>
              <p className="text-gray-600 text-lg">{job.company_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusColors[job.status]
                  }`}
                >
                  {statusLabels[job.status]}
                </span>
                <span className="text-sm text-gray-500">
                  Applied: {formatDate(job.applied_date)}
                </span>
              </div>
              {job.notes && (
                <p className="text-gray-700 mt-2 text-sm">{job.notes}</p>
              )}
              {job.application_url && (
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  View Application →
                </a>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {/* Status Quick Actions */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                onClick={() =>
                  handleStatusChange(status as JobApplication["status"])
                }
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  job.status === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                disabled={isEditing}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              className="px-3 py-1 text-sm"
              variant={isEditing ? "primary" : "secondary"}
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
            <Button
              onClick={handleDelete}
              className="px-3 py-1 text-sm"
              variant="danger"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
