import React, { useState, useEffect } from 'react';

type JobStatus = 'Applied' | 'Interview' | 'Rejected' | 'Offer' | 'Saved';

interface Job {
  id: string;
  title: string;
  company: string;
  appliedDate: string;
  status: JobStatus;
  notes?: string;
  timeline?: Array<{ date: string; event: string }>;
  tags?: string[];
}

// Mock chrome API for demo purposes
const mockChrome = {
  storage: {
    sync: {
      get: (keys: string[], callback: (result: any) => void) => {
        const stored = localStorage.getItem('jobs');
        callback({ jobs: stored ? JSON.parse(stored) : [] });
      },
      set: (data: any) => {
        localStorage.setItem('jobs', JSON.stringify(data.jobs));
      }
    }
  }
};

const JobTracker: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [newJob, setNewJob] = useState({ 
    title: '', 
    company: '', 
    status: 'Applied' as JobStatus, 
    tags: '' 
  });
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<JobStatus | 'All'>('All');

  // Use mock chrome for demo, replace with actual chrome API in extension
  const chromeAPI = typeof window !== 'undefined' && (window as any).chrome?.storage?.sync ? (window as any).chrome : mockChrome;

  // Load jobs from storage
  useEffect(() => {
    chromeAPI.storage.sync.get(['jobs'], (result: any) => {
      if (result.jobs && Array.isArray(result.jobs)) {
        setJobs(result.jobs);
      }
    });
  }, []);

  // Save jobs to storage
  const saveJobs = (updatedJobs: Job[]) => {
    setJobs(updatedJobs);
    chromeAPI.storage.sync.set({ jobs: updatedJobs });
  };

  // Add new job
  const addJob = () => {
    if (!newJob.title.trim() || !newJob.company.trim()) {
      alert('Please fill in both title and company');
      return;
    }

    const job: Job = {
      id: Date.now().toString(),
      title: newJob.title.trim(),
      company: newJob.company.trim(),
      appliedDate: new Date().toISOString().split('T')[0],
      status: newJob.status,
      notes: '',
      timeline: [{ 
        date: new Date().toISOString().split('T')[0], 
        event: newJob.status === 'Applied' ? 'Applied' : newJob.status 
      }],
      tags: newJob.tags ? newJob.tags.split(',').map(t => t.trim()).filter(t => t) : [],
    };
    
    saveJobs([job, ...jobs]);
    setShowAdd(false);
    setNewJob({ title: '', company: '', status: 'Applied', tags: '' });
  };

  // Update job status
  const updateStatus = (id: string, status: JobStatus) => {
    const updatedJobs = jobs.map(job =>
      job.id === id
        ? {
            ...job,
            status,
            timeline: [
              ...(job.timeline || []), 
              { date: new Date().toISOString().split('T')[0], event: status }
            ],
          }
        : job
    );
    saveJobs(updatedJobs);
  };

  // Add note
  const addNote = (id: string, note: string) => {
    const updatedJobs = jobs.map(job =>
      job.id === id ? { ...job, notes: note } : job
    );
    saveJobs(updatedJobs);
  };

  // Delete job
  const deleteJob = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      const updatedJobs = jobs.filter(job => job.id !== id);
      saveJobs(updatedJobs);
    }
  };

  // Filtered and searched jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(search.toLowerCase()) || 
      job.company.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || job.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Analytics
  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interview: jobs.filter(j => j.status === 'Interview').length,
    offer: jobs.filter(j => j.status === 'Offer').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
    saved: jobs.filter(j => j.status === 'Saved').length,
  };

  // Export to CSV
  const exportCSV = () => {
    const header = 'Title,Company,Status,AppliedDate,Tags,Notes\n';
    const rows = jobs.map(j => 
      `"${j.title}","${j.company}","${j.status}","${j.appliedDate}","${(j.tags || []).join('|')}","${(j.notes || '').replace(/"/g, '""')}"`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job_tracker_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const styles = {
    container: {
      background: '#FFFFFF',
      borderRadius: '1.5rem',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    },
    gradient: {
      background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)',
      height: '8px',
      borderRadius: '8px',
      marginBottom: '24px'
    },
    title: {
      fontSize: '1.4rem',
      fontWeight: 700,
      color: '#111827',
      marginBottom: '16px',
      margin: 0
    },
    searchContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap' as const
    },
    input: {
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
      padding: '8px',
      flex: 1,
      minWidth: '200px'
    },
    select: {
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
      padding: '8px',
      background: 'white'
    },
    button: {
      background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontWeight: 600
    },
    badge: {
      background: '#F3F4F6',
      color: '#374151',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '0.875rem',
      marginRight: '8px',
      display: 'inline-block',
      marginBottom: '4px'
    },
    card: {
      background: '#F9FAFB',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px'
    },
    deleteButton: {
      background: '#EF4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '0.875rem'
    },
    textarea: {
      width: '100%',
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
      padding: '8px',
      marginTop: '4px',
      resize: 'vertical' as const,
      fontFamily: 'inherit'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.gradient} />
      <h2 style={styles.title}>Job Tracker</h2>
      
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.input}
        />
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value as JobStatus | 'All')} 
          style={styles.select}
        >
          <option value="All">All</option>
          <option value="Applied">Applied</option>
          <option value="Interview">Interview</option>
          <option value="Rejected">Rejected</option>
          <option value="Offer">Offer</option>
          <option value="Saved">Saved</option>
        </select>
        <button style={styles.button} onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <span style={styles.badge}>Total: {stats.total}</span>
        <span style={styles.badge}>Applied: {stats.applied}</span>
        <span style={styles.badge}>Interview: {stats.interview}</span>
        <span style={styles.badge}>Offer: {stats.offer}</span>
        <span style={styles.badge}>Rejected: {stats.rejected}</span>
        <span style={styles.badge}>Saved: {stats.saved}</span>
      </div>

      <button 
        style={{...styles.button, marginBottom: '16px'}} 
        onClick={() => setShowAdd(!showAdd)}
      >
        {showAdd ? 'Cancel' : 'Add Job'}
      </button>

      {showAdd && (
        <div style={styles.card}>
          <input
            type="text"
            placeholder="Job Title"
            value={newJob.title}
            onChange={e => setNewJob({ ...newJob, title: e.target.value })}
            style={{...styles.input, width: '100%', marginBottom: '8px'}}
          />
          <input
            type="text"
            placeholder="Company"
            value={newJob.company}
            onChange={e => setNewJob({ ...newJob, company: e.target.value })}
            style={{...styles.input, width: '100%', marginBottom: '8px'}}
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={newJob.tags}
            onChange={e => setNewJob({ ...newJob, tags: e.target.value })}
            style={{...styles.input, width: '100%', marginBottom: '8px'}}
          />
          <select
            value={newJob.status}
            onChange={e => setNewJob({ ...newJob, status: e.target.value as JobStatus })}
            style={{...styles.select, width: '100%', marginBottom: '8px'}}
          >
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Rejected">Rejected</option>
            <option value="Offer">Offer</option>
            <option value="Saved">Saved</option>
          </select>
          <button style={styles.button} onClick={addJob}>
            Save Job
          </button>
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <p style={{ color: '#4B5563', textAlign: 'center', padding: '2rem' }}>
          {search || filter !== 'All' ? 'No jobs match your filters.' : 'No jobs tracked yet. Add your first job above!'}
        </p>
      ) : (
        filteredJobs.map(job => (
          <div key={job.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>
                  {job.title}
                </h3>
                <p style={{ color: '#4B5563', margin: '0 0 8px 0' }}>
                  {job.company}
                </p>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{...styles.badge, background: job.status === 'Offer' ? '#10B981' : job.status === 'Rejected' ? '#EF4444' : '#3B82F6', color: 'white'}}>
                    {job.status}
                  </span>
                  <span style={{ color: '#6B7280', fontSize: '0.875rem', marginLeft: '8px' }}>
                    Applied: {job.appliedDate}
                  </span>
                </div>
                {job.tags && job.tags.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    {job.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        style={{...styles.badge, background: '#EDE9FE', color: '#7C3AED'}}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                <select
                  value={job.status}
                  onChange={e => updateStatus(job.id, e.target.value as JobStatus)}
                  style={styles.select}
                >
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Offer">Offer</option>
                  <option value="Saved">Saved</option>
                </select>
                <button 
                  style={styles.deleteButton} 
                  onClick={() => deleteJob(job.id)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Notes:
              </label>
              <textarea
                value={job.notes || ''}
                onChange={e => addNote(job.id, e.target.value)}
                rows={2}
                style={styles.textarea}
                placeholder="Add notes, interview tips, recruiter info..."
              />
            </div>

            {job.timeline && job.timeline.length > 0 && (
              <div>
                <label style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Timeline:
                </label>
                <ul style={{ paddingLeft: '16px', margin: 0 }}>
                  {job.timeline.map((event, idx) => (
                    <li key={idx} style={{ color: '#4B5563', fontSize: '0.875rem', marginBottom: '2px' }}>
                      <strong>{event.date}:</strong> {event.event}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default JobTracker;



