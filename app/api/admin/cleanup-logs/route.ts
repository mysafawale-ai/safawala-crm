import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Execute the logs cleanup script
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        -- Delete old activity logs (older than 90 days)
        DELETE FROM activity_logs 
        WHERE created_at < NOW() - INTERVAL '90 days';

        -- Delete old integration logs (older than 30 days)
        DELETE FROM integration_logs 
        WHERE created_at < NOW() - INTERVAL '30 days';

        -- Vacuum tables to reclaim space
        VACUUM ANALYZE activity_logs;
        VACUUM ANALYZE integration_logs;
      `,
    })

    if (error) {
      console.error("Logs cleanup error:", error)
      return NextResponse.json({ error: "Failed to cleanup log data" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Log data cleanup completed successfully",
    })
  } catch (error) {
    console.error("Logs cleanup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
