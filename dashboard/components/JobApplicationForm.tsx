"use client";

import { useState } from "react";
import { JobApplication } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface JobApplicationFormProps {
  onSubmit: (
    job: Omit<JobApplication, "id" | "user_id" | "created_at" | "updated_at">
  ) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function JobApplicationForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: JobApplicationFormProps) {
  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    status: "applied" as JobApplication["status"],
    notes: "",
    application_url: "",
    applied_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.job_title.trim()) {
      alert("Please fill in company name and job title");
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6 text-gray-900">
        Add New Job Application
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <Input
              type="text"
              value={formData.company_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("company_name", e.target.value)}
              placeholder="e.g. Google, Microsoft, Amazon"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title *
            </label>
            <Input
              type="text"
              value={formData.job_title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("job_title", e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Status
            </label>
            <select
              value={formData.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange("status", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Date
            </label>
            <Input
              type="date"
              value={formData.applied_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("applied_date", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application URL
          </label>
          <Input
            type="url"
            value={formData.application_url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("application_url", e.target.value)}
            placeholder="https://company.com/careers/job/123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("notes", e.target.value)}
            placeholder="Add any additional notes about this application..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
