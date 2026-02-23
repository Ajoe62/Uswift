import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function toLegacyJobShape(row: any) {
  return {
    ...row,
    company_name: row.company,
    application_url: row.job_url,
    applied_date: row.applied_at,
    status: row.status === "interviewing" ? "interview" : row.status,
  };
}

function toApplicationsInsert(body: any) {
  return {
    user_id: body.user_id,
    company: body.company_name,
    job_title: body.job_title,
    status: body.status === "interview" ? "interviewing" : body.status || "applied",
    notes: body.notes || null,
    job_url: body.application_url || null,
    applied_at: body.applied_date || new Date().toISOString().split("T")[0],
  };
}

// GET /api/jobs - Fetch all job applications for the current user
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: jobs, error } = await supabase
      .from("applications")
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

    return NextResponse.json((jobs || []).map(toLegacyJobShape));
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
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

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

    const newJob = toApplicationsInsert({
      user_id: user.id,
      company_name,
      job_title,
      status,
      notes,
      application_url,
      applied_date,
    });

    const { data: job, error } = await supabase
      .from("applications")
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

    return NextResponse.json(toLegacyJobShape(job), { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
