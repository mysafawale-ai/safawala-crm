export async function GET() {
  try {
    const response = await fetch("https://live-mt-server.wati.io/481455/api/v1/getMessageTemplates", {
      method: "GET",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMWU0YjA3NS03ZmUxLTQzYmUtOTBiMC04NTExMjQxNjEzYTQiLCJ1bmlxdWVfbmFtZSI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwibmFtZWlkIjoibXlzYWZhd2FsZUBnbWFpbC5jb20iLCJlbWFpbCI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDgvMTIvMjAyNSAyMDoxMjo1NSIsInRlbmFudF9pZCI6IjQ4MTQ1NSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.ZmgPg4ZTHPhSytUlT0s2BfmUIEkzlKdAbogvVNzHTek",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`WATI API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform WATI response to our format
    const templateStatuses: Record<string, string> = {}

    if (data.messageTemplates && Array.isArray(data.messageTemplates)) {
      data.messageTemplates.forEach((template: any) => {
        if (template.name && template.status) {
          templateStatuses[template.name] = template.status.toUpperCase()
        }
      })
    }

    return Response.json({
      success: true,
      templateStatuses,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching WATI templates:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to fetch template statuses from WATI",
        templateStatuses: {},
      },
      { status: 500 },
    )
  }
}
