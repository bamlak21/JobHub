import { NextResponse } from "next/server";
import { baseUrl } from "../request";

{
  /*
  How do yo solve the Country or City problem

  1.Extract and format the search parameters
  2.For Hirebase, we need to simplify the location - it only accepts city OR country, not both
  3.If location contains a comma, take only the first part (city) or the last part (country)
  4.Prefer the country part if it's a recognizable country name
  5.Otherwise use the city part
  

  */
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const searchTerm = body.search_term ? body.search_term.trim() : "";
    let location = body.location ? body.location.trim() : "";

    if (location.includes(",")) {
      const locationParts = location.split(",");

      const countryNames = [
        "USA",
        "United States",
        "Canada",
        "UK",
        "United Kingdom",
        "Australia",
        "Germany",
      ];
      const countryPart = locationParts[locationParts.length - 1].trim();

      if (countryNames.some((country) => countryPart.includes(country))) {
        location = countryPart === "United States" ? "USA" : countryPart;
      } else {
        location = locationParts[0].trim();
      }
    }

    console.log("Hirebase API request:", {
      search_term: searchTerm,
      location: location,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    try {
      const response = await fetch(`${baseUrl}/hirebase/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_term: searchTerm,
          location: location,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Hirebase API responded with status: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Hirebase API response structure:", {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : "not an array",
        firstElementIsArray:
          Array.isArray(data) && data.length > 0
            ? Array.isArray(data[0])
            : "N/A",
        firstElementLength:
          Array.isArray(data) && data.length > 0 && Array.isArray(data[0])
            ? data[0].length
            : "N/A",
      });

      if (!Array.isArray(data) || data.length === 0) {
        console.error("Hirebase API did not return a valid array:", data);
        return NextResponse.json([], { status: 200 });
      }

      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error in Hirebase API:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in Hirebase proxy:", error);
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? "Request timed out. Please try again."
        : `Failed to fetch data from Hirebase: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
