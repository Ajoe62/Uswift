// Dashboard and Job Application Types
export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  status: "applied" | "interview" | "offer" | "rejected" | "withdrawn";
  applied_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  application_url?: string;
}

export interface DashboardStats {
  totalApplications: number;
  interviews: number;
  offers: number;
  thisMonthApplications: number;
  successRate: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  // Add any additional user profile fields
  full_name?: string;
  avatar_url?: string;
}
