import React, { useState, useEffect } from "react";
import "./index.css";
import { useAuth } from "./hooks/useAuth";

declare const supabase: any;

type JobStatus = "applied" | "interviewing" | "offer" | "rejected" | "archived";

interface JobApplication {
  id?: string;
  company: string;
  position: string;
  status: JobStatus;
  dateApplied: string;
  jobUrl?: string;
  notes?: string;
  tags?: string[];
}

const JobTracker: React.FC = () => {
  // Normalize thrown values so we never throw non-Error values (like Events)
  const throwNormalized = (err: any) => {
    if (err instanceof Error) throw err;
    throw new Error(String(err));
  };
  const { user, isAuthenticated } = useAuth
    ? useAuth()
    : { user: null, isAuthenticated: false };
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "company" | "status">("date");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newApplication, setNewApplication] = useState<JobApplication>({
    company: "",
    position: "",
    status: "applied",
    dateApplied: new Date().toISOString().split("T")[0],
    jobUrl: "",
    notes: "",
    tags: [],
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFromSupabase();
    } else {
      loadFromChromeStorage();
    }
  }, [isAuthenticated, user]);

  const loadFromSupabase = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
      const { data: apps, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("applied_date", { ascending: false });
      if (error) throwNormalized(error);
      const formattedApps =
        apps?.map((app: any) => ({
          id: app.id,
          company: app.company,
          position: app.position,
          status: app.status,
          dateApplied: app.applied_date,
          jobUrl: app.job_url,
          notes: app.notes,
          tags: app.tags || [],
        })) || [];
      setApplications(formattedApps);
    } catch (error) {
      console.error("Error loading from Supabase:", error);
      loadFromChromeStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromChromeStorage = () => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.sync
    ) {
      chrome.storage.sync.get(["jobApplications"], (result: any) => {
        if (result.jobApplications) {
          setApplications(result.jobApplications);
        }
      });
    }
  };

  const saveToSupabase = async (application: JobApplication) => {
    try {
      if (!user?.id) return false;
      const appData = {
        user_id: user.id,
        company: application.company,
        position: application.position,
        status: application.status,
        applied_date: application.dateApplied,
        job_url: application.jobUrl,
        notes: application.notes,
        tags: application.tags,
        updated_at: new Date().toISOString(),
      };
      if (application.id) {
        const { error } = await supabase
          .from("job_applications")
          .update(appData)
          .eq("id", application.id);
        if (error) throwNormalized(error);
      } else {
        const { data, error } = await supabase
          .from("job_applications")
          .insert([appData])
          .select()
          .single();
        if (error) throwNormalized(error);
        return data.id;
      }
      return true;
    } catch (error) {
      console.error("Error saving to Supabase:", error);
      return false;
    }
  };

  const saveToChrome = (apps: JobApplication[]) => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.sync
    ) {
      chrome.storage.sync.set({ jobApplications: apps });
    }
  };

  const addApplication = async () => {
    if (!newApplication.company || !newApplication.position) {
      alert("Please fill in company and position fields.");
      return;
    }
    setLoading(true);
    if (isAuthenticated && user) {
      const id = await saveToSupabase(newApplication);
      if (id) {
        const appWithId = {
          ...newApplication,
          id: typeof id === "string" ? id : String(id),
        };
        const updatedApps = [appWithId, ...applications];
        setApplications(updatedApps);
      }
    } else {
      const appWithId = { ...newApplication, id: Date.now().toString() };
      const updatedApps = [appWithId, ...applications];
      setApplications(updatedApps);
      saveToChrome(updatedApps);
    }
    setNewApplication({
      company: "",
      position: "",
      status: "applied",
      dateApplied: new Date().toISOString().split("T")[0],
      jobUrl: "",
      notes: "",
      tags: [],
    });
    setShowAddForm(false);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: JobStatus) => {
    const updatedApps = applications.map((app) =>
      app.id === id ? { ...app, status } : app
    );
    setApplications(updatedApps);
    if (isAuthenticated && user) {
      const app = updatedApps.find((a) => a.id === id);
      if (app) {
        await saveToSupabase(app);
      }
    } else {
      saveToChrome(updatedApps);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from("job_applications")
          .delete()
          .eq("id", id);
        if (error) throwNormalized(error);
      } catch (error) {
        console.error("Error deleting from Supabase:", error);
      }
    }
    const updatedApps = applications.filter((app) => app.id !== id);
    setApplications(updatedApps);
    if (!isAuthenticated) {
      saveToChrome(updatedApps);
    }
  };

  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "company":
          return a.company.localeCompare(b.company);
        case "status":
          return a.status.localeCompare(b.status);
        case "date":
        default:
          return (
            new Date(b.dateApplied).getTime() -
            new Date(a.dateApplied).getTime()
          );
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "#3B82F6";
      case "interviewing":
        return "#F59E0B";
      case "offer":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      case "archived":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const getStatusCount = (status: string) => {
    return applications.filter((app) => app.status === status).length;
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Company", "Position", "Status", "Date Applied", "Job URL", "Notes"],
      ...filteredApplications.map((app) => [
        app.company,
        app.position,
        app.status,
        app.dateApplied,
        app.jobUrl || "",
        app.notes || "",
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job_applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "1.5rem",
        padding: "2rem",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <div
        className="uswift-gradient"
        style={{ height: 8, borderRadius: 8, marginBottom: 24 }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827" }}>
          Job Tracker
        </h2>
        {isAuthenticated && (
          <span
            style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 600 }}
          >
            ☁️ Cloud Sync
          </span>
        )}
      </div>
      {/* Stats Dashboard */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#F3F4F6",
            padding: 12,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3B82F6" }}
          >
            {getStatusCount("applied")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Applied</div>
        </div>
        <div
          style={{
            background: "#F3F4F6",
            padding: 12,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#F59E0B" }}
          >
            {getStatusCount("interviewing")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>
            Interviewing
          </div>
        </div>
        <div
          style={{
            background: "#F3F4F6",
            padding: 12,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10B981" }}
          >
            {getStatusCount("offer")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Offers</div>
        </div>
        <div
          style={{
            background: "#F3F4F6",
            padding: 12,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "1.5rem", fontWeight: 700, color: "#EF4444" }}
          >
            {getStatusCount("rejected")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Rejected</div>
        </div>
      </div>
      {/* Controls */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        <input
          type="text"
          placeholder="Search companies or positions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #E5E7EB",
            fontSize: "0.9rem",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #E5E7EB",
            fontSize: "0.9rem",
          }}
        >
          <option value="all">All Status</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "date" | "company" | "status")
          }
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #E5E7EB",
            fontSize: "0.9rem",
          }}
        >
          <option value="date">Sort by Date</option>
          <option value="company">Sort by Company</option>
          <option value="status">Sort by Status</option>
        </select>
        <button
          className="uswift-btn"
          style={{ fontSize: "0.9rem", padding: "8px 12px" }}
          onClick={() => setShowAddForm(true)}
        >
          + Add Job
        </button>
        <button
          onClick={exportToCSV}
          style={{
            background: "#EDE9FE",
            color: "#6D28D9",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Export CSV
        </button>
      </div>
      {/* Add Application Form */}
      {showAddForm && (
        <div
          style={{
            background: "#F9FAFB",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h3 style={{ marginBottom: 12, fontSize: "1rem", fontWeight: 600 }}>
            Add New Application
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <input
              type="text"
              placeholder="Company"
              value={newApplication.company}
              onChange={(e) =>
                setNewApplication({
                  ...newApplication,
                  company: e.target.value,
                })
              }
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #E5E7EB",
              }}
            />
            <input
              type="text"
              placeholder="Position"
              value={newApplication.position}
              onChange={(e) =>
                setNewApplication({
                  ...newApplication,
                  position: e.target.value,
                })
              }
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #E5E7EB",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <select
              value={newApplication.status}
              onChange={(e) =>
                setNewApplication({
                  ...newApplication,
                  status: e.target.value as JobStatus,
                })
              }
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #E5E7EB",
              }}
            >
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
            <input
              type="date"
              value={newApplication.dateApplied}
              onChange={(e) =>
                setNewApplication({
                  ...newApplication,
                  dateApplied: e.target.value,
                })
              }
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #E5E7EB",
              }}
            />
          </div>
          <input
            type="url"
            placeholder="Job URL (optional)"
            value={newApplication.jobUrl}
            onChange={(e) =>
              setNewApplication({ ...newApplication, jobUrl: e.target.value })
            }
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #E5E7EB",
              marginBottom: 12,
            }}
          />
          <textarea
            placeholder="Notes (optional)"
            value={newApplication.notes}
            onChange={(e) =>
              setNewApplication({ ...newApplication, notes: e.target.value })
            }
            rows={2}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #E5E7EB",
              marginBottom: 12,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="uswift-btn"
              onClick={addApplication}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Adding..." : "Add Application"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                background: "#F3F4F6",
                color: "#6B7280",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Applications List */}
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {loading && applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
            {applications.length === 0
              ? 'No applications yet. Click "Add Job" to get started!'
              : "No applications match your search."}
          </div>
        ) : (
          filteredApplications.map((app) => (
            <div
              key={app.id}
              style={{
                background: "#F9FAFB",
                padding: 16,
                borderRadius: 8,
                marginBottom: 12,
                border: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "#111827",
                    }}
                  >
                    {app.position}
                  </h3>
                  <p
                    style={{
                      color: "#6B7280",
                      fontSize: "0.9rem",
                      marginBottom: 4,
                    }}
                  >
                    {app.company} • Applied{" "}
                    {new Date(app.dateApplied).toLocaleDateString()}
                  </p>
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#6D28D9",
                        fontSize: "0.85rem",
                        textDecoration: "none",
                      }}
                    >
                      View Job Posting →
                    </a>
                  )}
                  {app.notes && (
                    <p
                      style={{
                        color: "#4B5563",
                        fontSize: "0.85rem",
                        marginTop: 8,
                      }}
                    >
                      {app.notes}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <select
                    value={app.status}
                    onChange={(e) =>
                      updateStatus(app.id!, e.target.value as JobStatus)
                    }
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #E5E7EB",
                      fontSize: "0.8rem",
                      color: getStatusColor(app.status),
                      fontWeight: 600,
                    }}
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    onClick={() => deleteApplication(app.id!)}
                    style={{
                      background: "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobTracker;
