import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const response = await fetch("https://ah6ti5nxxwqv.share.zrok.io/linkdin/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        skill: body.skill,
        location: body.location,
        pagenumber: body.pagenumber,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      throw new Error(`LinkedIn API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in LinkedIn proxy:", error)
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? "Request timed out. Please try again."
        : "Failed to fetch data from LinkedIn"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
