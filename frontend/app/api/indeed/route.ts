import { NextResponse } from "next/server";
import { baseUrl } from "../request";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const response = await fetch(`${baseUrl}/indeed/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_term: body.search_term,
        google_search_term: body.google_search_term,
        location: body.location,
        results_wanted: body.results_wanted || 50, // increased the result wanted
        hours_old: body.hours_old || 72, // the duration to two days
        country_indeed: body.country_indeed || "USA",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`Indeed API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in Indeed proxy:", error);
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? "Request timed out. Please try again."
        : "Failed to fetch data from Indeed";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
