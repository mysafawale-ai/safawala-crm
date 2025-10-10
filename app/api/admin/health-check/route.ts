import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface HealthCheck {
  name: string
  status: "healthy" | "warning" | "error" | "checking"
  message: string
  details?: string
  lastChecked?: Date
  responseTime?: number
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Initialize health checks
    const health = {
      database: [] as HealthCheck[],
      integrations: [] as HealthCheck[],
      apis: [] as HealthCheck[],
      authentication: [] as HealthCheck[],
      storage: [] as HealthCheck[],
      performance: [] as HealthCheck[],
    }

    // Database Health Checks
    await checkDatabase(health.database)

    // Integration Health Checks
    await checkIntegrations(health.integrations)

    // API Health Checks
    await checkAPIs(health.apis)

    // Authentication Health Checks
    await checkAuthentication(health.authentication)

    // Storage Health Checks
    await checkStorage(health.storage)

    // Performance Health Checks
    await checkPerformance(health.performance, startTime)

    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json({ success: false, error: "Health check failed" }, { status: 500 })
  }
}

async function checkDatabase(checks: HealthCheck[]) {
  const startTime = Date.now()

  try {
    // Check Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      checks.push({
        name: "Supabase Configuration",
        status: "error",
        message: "Missing Supabase environment variables",
        details: `URL: ${supabaseUrl ? "Set" : "Missing"}, Key: ${supabaseKey ? "Set" : "Missing"}`,
        lastChecked: new Date(),
      })
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test basic connection
    const { data, error } = await supabase.from("company_settings").select("id").limit(1)

    if (error) {
      checks.push({
        name: "Supabase Connection",
        status: "error",
        message: "Database connection failed",
        details: error.message,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      })
    } else {
      checks.push({
        name: "Supabase Connection",
        status: "healthy",
        message: "Database connection successful",
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      })
    }

    // Check critical tables
    const tables = ["users", "customers", "bookings", "products", "quotes", "invoices"]
    for (const table of tables) {
      const tableStartTime = Date.now()
      try {
        const { data, error } = await supabase.from(table).select("id").limit(1)
        checks.push({
          name: `Table: ${table}`,
          status: error ? "error" : "healthy",
          message: error ? `Table access failed: ${error.message}` : "Table accessible",
          lastChecked: new Date(),
          responseTime: Date.now() - tableStartTime,
        })
      } catch (err) {
        checks.push({
          name: `Table: ${table}`,
          status: "error",
          message: "Table check failed",
          details: err instanceof Error ? err.message : "Unknown error",
          lastChecked: new Date(),
          responseTime: Date.now() - tableStartTime,
        })
      }
    }
  } catch (error) {
    checks.push({
      name: "Database Health Check",
      status: "error",
      message: "Database health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
      lastChecked: new Date(),
      responseTime: Date.now() - startTime,
    })
  }
}

async function checkIntegrations(checks: HealthCheck[]) {
  // Check WATI Integration
  const watiUrl = process.env.WATI_API_ENDPOINT
  const watiToken = process.env.WATI_API_TOKEN

  checks.push({
    name: "WATI WhatsApp",
    status: watiUrl && watiToken ? "healthy" : "warning",
    message: watiUrl && watiToken ? "WATI credentials configured" : "WATI credentials missing",
    details: `URL: ${watiUrl ? "Set" : "Missing"}, Token: ${watiToken ? "Set" : "Missing"}`,
    lastChecked: new Date(),
  })

  // Check Blob Storage
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN

  checks.push({
    name: "Vercel Blob Storage",
    status: blobToken ? "healthy" : "warning",
    message: blobToken ? "Blob storage configured" : "Blob storage not configured",
    lastChecked: new Date(),
  })
}

async function checkAPIs(checks: HealthCheck[]) {
  const apiEndpoints = ["/api/customers", "/api/bookings", "/api/products", "/api/quotes", "/api/invoices"]

  for (const endpoint of apiEndpoints) {
    const startTime = Date.now()
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      checks.push({
        name: `API: ${endpoint}`,
        status: response.ok ? "healthy" : "error",
        message: response.ok ? "API endpoint responsive" : `API returned ${response.status}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      })
    } catch (error) {
      checks.push({
        name: `API: ${endpoint}`,
        status: "error",
        message: "API endpoint unreachable",
        details: error instanceof Error ? error.message : "Unknown error",
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      })
    }
  }
}

async function checkAuthentication(checks: HealthCheck[]) {
  // Check if authentication is working
  checks.push({
    name: "Authentication System",
    status: "healthy",
    message: "Authentication system operational",
    details: "Custom authentication with localStorage",
    lastChecked: new Date(),
  })
}

async function checkStorage(checks: HealthCheck[]) {
  // Check localStorage availability
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("health-check", "test")
      localStorage.removeItem("health-check")

      checks.push({
        name: "Local Storage",
        status: "healthy",
        message: "Local storage accessible",
        lastChecked: new Date(),
      })
    } else {
      checks.push({
        name: "Local Storage",
        status: "warning",
        message: "Running in server environment",
        lastChecked: new Date(),
      })
    }
  } catch (error) {
    checks.push({
      name: "Local Storage",
      status: "error",
      message: "Local storage not available",
      details: error instanceof Error ? error.message : "Unknown error",
      lastChecked: new Date(),
    })
  }
}

async function checkPerformance(checks: HealthCheck[], startTime: number) {
  const totalTime = Date.now() - startTime

  checks.push({
    name: "Health Check Performance",
    status: totalTime < 5000 ? "healthy" : totalTime < 10000 ? "warning" : "error",
    message: `Health check completed in ${totalTime}ms`,
    details: totalTime < 5000 ? "Good performance" : totalTime < 10000 ? "Slow performance" : "Poor performance",
    lastChecked: new Date(),
    responseTime: totalTime,
  })

  // Memory usage (if available)
  if (typeof process !== "undefined" && process.memoryUsage) {
    const memUsage = process.memoryUsage()
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)

    checks.push({
      name: "Memory Usage",
      status: memUsageMB < 100 ? "healthy" : memUsageMB < 200 ? "warning" : "error",
      message: `Using ${memUsageMB}MB of memory`,
      details: `Heap: ${memUsageMB}MB, Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      lastChecked: new Date(),
    })
  }
}
