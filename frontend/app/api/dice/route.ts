import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) 
    
    const location = body.location ? body.location.trim() : ""

    try {
      const response = await fetch("https://ubgry5tetyhn.share.zrok.io/dice/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_term: body.search_term,
          location: location,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId) 
      if (!response.ok) {
        throw new Error(`Dice API responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error("Error in Dice proxy:", error)

    let errorMessage = "Failed to fetch data from Dice"

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "The request to Dice API timed out. Please try again later."
      } else {
        errorMessage = `Error: ${error.message}`
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

