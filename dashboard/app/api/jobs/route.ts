import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import { JobApplication } from "@/lib/types";

// GET /api/jobs - Fetch all job applications for the current user
export async function GET(req: NextRequest) {
  try {

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: jobs, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return NextResponse.json(
        { error: "Failed to fetch job applications" },
        { status: 500 }
      );
    }

    return NextResponse.json(jobs || []);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job application
export async function POST(req: NextRequest) {
  try {

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      company_name,
      job_title,
      status,
      notes,
      application_url,
      applied_date,
    } = body;

    if (!company_name || !job_title) {
      return NextResponse.json(
        { error: "Company name and job title are required" },
        { status: 400 }
      );
    }

    const newJob = {
      user_id: user.id,
      company_name,
      job_title,
      status: status || "applied",
      notes: notes || null,
      application_url: application_url || null,
      applied_date: applied_date || new Date().toISOString().split("T")[0],
    };

    const { data: job, error } = await supabase
      .from("job_applications")
      .insert(newJob)
      .select()
      .single();

    if (error) {
      console.error("Error creating job:", error);
      return NextResponse.json(
        { error: "Failed to create job application" },
        { status: 500 }
      );
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
