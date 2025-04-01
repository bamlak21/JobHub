import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch("https://ubgry5tetyhn.share.zrok.io/ziprecuter/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_term: body.search_term,
        google_search_term: body.google_search_term,
        location: body.location,
        results_wanted: body.results_wanted || 20,
        hours_old: body.hours_old || 24,
        country_indeed: body.country_indeed || "USA",
      }),
    })

    if (!response.ok) {
      throw new Error(`ZipRecruiter API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in ZipRecruiter proxy:", error)
    return NextResponse.json({ error: "Failed to fetch data from ZipRecruiter" }, { status: 500 })
  }
}

