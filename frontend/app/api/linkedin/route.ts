import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch("https://ubgry5tetyhn.share.zrok.io/linkdin/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        skill: body.skill,
        location: body.location,
        pagenumber: body.pagenumber,
      }),
    })

    if (!response.ok) {
      throw new Error(`LinkedIn API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in LinkedIn proxy:", error)
    return NextResponse.json({ error: "Failed to fetch data from LinkedIn" }, { status: 500 })
  }
}

