import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/jobs/[id] - Update a job application
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { company_name, job_title, status, notes, application_url } = body;

    const { data: job, error } = await supabase
      .from("job_applications")
      .update({
        company_name,
        job_title,
        status,
        notes,
        application_url,
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating job:", error);
      return NextResponse.json(
        { error: "Failed to update job application" },
        { status: 500 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job application
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting job:", error);
      return NextResponse.json(
        { error: "Failed to delete job application" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Job application deleted successfully",
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
