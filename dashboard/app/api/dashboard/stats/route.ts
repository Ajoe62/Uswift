import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get statistics for the current user
    const { data: stats, error } = await supabase
      .from("job_applications")
      .select("status, created_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalApplications = stats?.length || 0;
    const interviews =
      stats?.filter((app: any) => app.status === "interview").length || 0;
    const offers = stats?.filter((app: any) => app.status === "offer").length || 0;

    // Calculate applications this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const thisMonthApplications =
      stats?.filter((app: any) => {
        const appDate = new Date(app.created_at);
        return (
          appDate.getMonth() === currentMonth &&
          appDate.getFullYear() === currentYear
        );
      }).length || 0;

    return NextResponse.json({
      totalApplications,
      interviews,
      offers,
      thisMonthApplications,
      successRate:
        totalApplications > 0
          ? ((offers / totalApplications) * 100).toFixed(1)
          : 0,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
