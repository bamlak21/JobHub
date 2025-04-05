import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Hirebase API request:", body)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const response = await fetch("https://ubgry5tetyhn.share.zrok.io/hirebase/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_term: body.search_term,
        location: body.location,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      throw new Error(`Hirebase API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Hirebase API response structure:", {
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : "not an array",
      firstElementIsArray: Array.isArray(data) && data.length > 0 ? Array.isArray(data[0]) : "N/A",
      firstElementLength: Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) ? data[0].length : "N/A",
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Hirebase proxy:", error)
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? "Request timed out. Please try again."
        : "Failed to fetch data from Hirebase"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

