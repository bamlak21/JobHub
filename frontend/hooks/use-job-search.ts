"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Job, SearchState, TagState, JobPlatform } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

// Constants moved to a separate file
import { topTechStates } from "@/lib/location-data"

export function useJobSearch(initialJobs: Job[]) {
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(initialJobs)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [locationWarning, setLocationWarning] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [searchState, setSearchState] = useState<SearchState>({
    searchTerm: "",
    location: {
      country: "usa",
      region: "",
      cityLocation: "San Francisco, CA",
      apiLocation: "usa",
    },
    platform: "indeed",
    currentPage: 1,
    totalPages: 1,
  })

  const [tagState, setTagState] = useState<TagState>({
    selectedTags: [],
    jobTags: [],
    showRegions: false,
    selectedRegion: "",
    autoFetch: false,
  })

  const autoFetchIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup auto-fetch interval on unmount
  useEffect(() => {
    return () => {
      if (autoFetchIntervalRef.current) {
        clearInterval(autoFetchIntervalRef.current)
      }
    }
  }, [])

  // Handle platform changes and set appropriate warnings
  useEffect(() => {
    setSearchState((prev) => ({ ...prev, currentPage: 1 }))

    if (searchState.platform === "dice") {
      const isUSLocation =
        searchState.location.cityLocation.includes("USA") ||
        searchState.location.cityLocation.includes("US") ||
        topTechStates.some((state) => searchState.location.cityLocation.includes(state))

      if (!isUSLocation && searchState.location.cityLocation !== "Remote") {
        setLocationWarning("Dice works best with US locations. Results may be limited for international searches.")
      } else {
        setLocationWarning(null)
      }
    } else if (searchState.platform === "hirebase") {
      setLocationWarning(
        "Hirebase accepts either a city or country, but not both. Using the most relevant part of your location.",
      )
    } else {
      setLocationWarning(null)
    }
  }, [searchState.platform, searchState.location.cityLocation])

  // Setup auto-fetch functionality
  useEffect(() => {
    if (autoFetchIntervalRef.current) {
      clearInterval(autoFetchIntervalRef.current)
      autoFetchIntervalRef.current = null
    }

    if (tagState.autoFetch && (tagState.selectedTags.length > 0 || tagState.jobTags.length > 0)) {
      autoFetchIntervalRef.current = setInterval(() => {
        handleSearch()
      }, 30000) // 30 seconds
    }

    return () => {
      if (autoFetchIntervalRef.current) {
        clearInterval(autoFetchIntervalRef.current)
      }
    }
  }, [tagState.autoFetch, tagState.selectedTags, tagState.jobTags, searchState])

  // Filter jobs based on search term and tags
  useEffect(() => {
    const filtered = initialJobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchState.searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchState.searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchState.searchTerm.toLowerCase())

      const matchesLocationTags = tagState.selectedTags.length === 0 || tagState.selectedTags.includes(job.location)

      const matchesJobTags =
        tagState.jobTags.length === 0 ||
        tagState.jobTags.some((tag) => job.title.toLowerCase().includes(tag.toLowerCase()))

      return matchesSearch && matchesLocationTags && matchesJobTags
    })

    setFilteredJobs(filtered)
  }, [searchState.searchTerm, tagState.selectedTags, tagState.jobTags, initialJobs])

  // Toggle location tag selection
  const toggleLocationTag = (tag: string) => {
    setTagState((prev) => {
      const isTagSelected = prev.selectedTags.includes(tag)
      const updatedTags = isTagSelected ? [] : [tag]

      let apiLocation = "usa"
      let cityLoc = "San Francisco, CA"
      let showRegions = false
      let selectedRegion = ""

      if (!isTagSelected) {
        if (tag === "United States") {
          apiLocation = "usa"
          cityLoc = "San Francisco, CA"
          showRegions = true
          selectedRegion = ""
        } else if (tag === "Canada") {
          apiLocation = "canada"
          cityLoc = "Toronto, Canada"
          showRegions = true
          selectedRegion = ""
        } else if (tag === "United Kingdom") {
          apiLocation = "uk"
          cityLoc = "London, UK"
        } else if (tag === "Germany") {
          apiLocation = "germany"
          cityLoc = "Berlin, Germany"
        } else if (tag === "Australia") {
          apiLocation = "australia"
          cityLoc = "Sydney, Australia"
        } else if (tag === "Remote") {
          apiLocation = "remote"
          cityLoc = "Remote"
        }
      }

      setSearchState((prevSearch) => ({
        ...prevSearch,
        location: {
          ...prevSearch.location,
          apiLocation,
          cityLocation: cityLoc,
          region: selectedRegion,
        },
      }))

      if (!isTagSelected && prev.autoFetch) {
        setTimeout(() => handleSearch(), 0)
      }

      return {
        ...prev,
        selectedTags: updatedTags,
        showRegions,
        selectedRegion,
      }
    })
  }

  // Toggle job tag selection
  const toggleJobTag = (tag: string) => {
    setTagState((prev) => {
      const isTagSelected = prev.jobTags.includes(tag)
      const updatedTags = isTagSelected ? prev.jobTags.filter((t) => t !== tag) : [...prev.jobTags, tag]

      if (!isTagSelected) {
        setSearchState((prevSearch) => ({
          ...prevSearch,
          searchTerm: tag,
        }))

        if (prev.autoFetch) {
          setTimeout(() => handleSearch(), 0)
        }
      }

      return {
        ...prev,
        jobTags: updatedTags,
      }
    })
  }

  // Handle region selection
  const handleRegionSelect = (region: string) => {
    setTagState((prev) => ({
      ...prev,
      selectedRegion: region,
    }))

    const country = tagState.selectedTags.find((tag) => tag === "United States" || tag === "Canada")
    let cityLocation = ""

    if (country === "United States") {
      cityLocation = `${region}, USA`
    } else if (country === "Canada") {
      cityLocation = `${region}, Canada`
    }

    setSearchState((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        region,
        cityLocation,
      },
    }))

    if (tagState.autoFetch) {
      setTimeout(() => handleSearch(), 0)
    }
  }

  // Toggle auto-fetch feature
  const toggleAutoFetch = () => {
    setTagState((prev) => ({
      ...prev,
      autoFetch: !prev.autoFetch,
    }))
  }

  // Format location for different platforms
  const getLocationForPlatform = (platform: JobPlatform, location: string): string => {
    if (platform === "dice") {
      if (location === "Remote") {
        return "Remote"
      }

      const locationParts = location.split(",")
      if (locationParts.length > 1) {
        return locationParts[0].trim()
      }
      return location
    } else if (platform === "hirebase") {
      if (location === "Remote") {
        return "Remote"
      }

      if (location.includes(",")) {
        const locationParts = location.split(",")
        const countryPart = locationParts[locationParts.length - 1].trim()

        if (["USA", "United States", "Canada", "UK", "United Kingdom", "Australia", "Germany"].includes(countryPart)) {
          return countryPart === "United States" ? "USA" : countryPart
        }

        return locationParts[0].trim()
      }
      return location
    }
    return location
  }

  // Main search function
  const handleSearch = useCallback(
    async (page?: number) => {
      const { searchTerm, location, platform } = searchState
      const pageToUse = page || searchState.currentPage

      if (!searchTerm.trim()) {
        toast({
          title: "Please enter a search term",
          description: "Enter a job title, company, or keywords to search",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      try {
        let endpoint = ""
        let requestBody = {}

        const indeedZipBody = {
          search_term: searchTerm,
          google_search_term: `${searchTerm} jobs near ${location.cityLocation} since yesterday`,
          location: location.cityLocation,
          results_wanted: 50,
          hours_old: 72,
          country_indeed: location.apiLocation.toUpperCase() === "USA" ? "USA" : location.apiLocation.toUpperCase(),
        }

        if (platform === "indeed") {
          endpoint = "/api/indeed"
          requestBody = indeedZipBody
        } else if (platform === "linkedin") {
          endpoint = "/api/linkedin"
          requestBody = {
            skill: searchTerm,
            location: location.cityLocation,
            pagenumber: pageToUse,
          }
        } else if (platform === "ziprecruiter") {
          endpoint = "/api/ziprecruiter"
          requestBody = indeedZipBody
        } else if (platform === "dice") {
          endpoint = "/api/dice"
          const formattedLocation = getLocationForPlatform("dice", location.cityLocation)
          requestBody = {
            search_term: searchTerm,
            location: formattedLocation,
          }
        } else if (platform === "hirebase") {
          endpoint = "/api/hirebase"
          const formattedLocation = getLocationForPlatform("hirebase", location.cityLocation)
          requestBody = {
            search_term: searchTerm,
            location: formattedLocation,
          }
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error: ${response.status}`)
        }

        const data = await response.json()

        if (!data || data.error) {
          throw new Error(data?.error || "No data returned from API")
        }

        const apiJobs = processApiResponse(data, platform, location.cityLocation)

        setSearchState((prev) => ({
          ...prev,
          currentPage: pageToUse,
          totalPages: platform === "linkedin" && apiJobs.length > 0 ? 10 : 1,
        }))

        setFilteredJobs(apiJobs)
        setLastFetchTime(new Date())

        toast({
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} search completed`,
          description: `Found ${apiJobs.length} jobs matching "${searchTerm}"`,
        })
      } catch (error) {
        console.error("Error fetching jobs:", error)
        toast({
          title: "Error searching jobs",
          description:
            error instanceof Error
              ? error.message
              : "There was a problem connecting to the search service. Please try again.",
          variant: "destructive",
        })

        setFilteredJobs(initialJobs)
      } finally {
        setIsLoading(false)
      }
    },
    [searchState, initialJobs],
  )

  // Process API response based on platform
  const processApiResponse = (data: any, platform: JobPlatform, locationCity: string): Job[] => {
    if (!Array.isArray(data)) {
      return []
    }

    if (platform === "indeed") {
      return data.map((item: any[], index: number) => ({
        id: `indeed-${index}`,
        title: item[1] || "Unknown Position",
        company: item[0] || "Unknown Company",
        location: locationCity,
        description: `This job was posted on Indeed. Click "View Details" to learn more.`,
        salary: item[5] && item[5] !== "0-0 nan" ? item[5] : "Salary not specified",
        postedDate: item[3] || new Date().toISOString(),
        url: item[2] || "#",
        source: "Indeed",
        logoUrl: item[4] || null,
      }))
    } else if (platform === "linkedin") {
      return data.map((item: any[], index: number) => ({
        id: `linkedin-${index}`,
        title: item[1] || "Unknown Position",
        company: item[0] || "Unknown Company",
        location: locationCity,
        description: `This job was posted on LinkedIn. Click "View Details" to learn more.`,
        salary: item[3] || "Salary not specified",
        postedDate: new Date().toISOString(),
        postedTimeAgo: item[4] || "Recently",
        url: item[2] || "#",
        source: "LinkedIn",
      }))
    } else if (platform === "ziprecruiter") {
      return data.map((item: any[], index: number) => ({
        id: `ziprecruiter-${index}`,
        title: item[1] || "Unknown Position",
        company: item[0] || "Unknown Company",
        location: locationCity,
        description: `This job was posted on ZipRecruiter. Click "View Details" to learn more.`,
        salary: item[4] || "Salary not specified",
        postedDate: item[3] || new Date().toISOString(),
        url: item[2] || "#",
        source: "ZipRecruiter",
      }))
    } else if (platform === "dice") {
      return data.map((item: any, index: number) => {
        const jobLocation = item.location || locationCity
        const title = item.title || "Unknown Position"
        const company = item.company || "Unknown Company"
        const description = item.employment_type
          ? `${item.employment_type} position. ${item.post_date || "Recently posted"}.`
          : "Click 'View Details' to learn more about this position."
        const salary = item.salary && item.salary !== "Not disclosed" ? item.salary : "Salary not specified"
        const url = item.url && item.url !== "N/A" ? item.url : "#"

        return {
          id: `dice-${index}-${Date.now()}`,
          title,
          company,
          location: jobLocation,
          description,
          salary,
          postedDate: new Date().toISOString(),
          postedTimeAgo: item.post_date || "Recently",
          url,
          source: "Dice",
        }
      })
    } else if (platform === "hirebase") {
      // Hirebase returns a nested array structure
      if (data.length > 0 && Array.isArray(data[0])) {
        return data[0].map((item: any, index: number) => {
          // Extract location information
          let jobLocation = locationCity
          if (item.locations && item.locations.length > 0) {
            const loc = item.locations[0]
            const city = loc.city ? `${loc.city}, ` : ""
            const region = loc.region ? loc.region : ""
            const country = loc.country ? `, ${loc.country}` : ""
            jobLocation = city + region + country
          }

          // Format salary information if available
          let salaryText = "Salary not specified"
          if (item.salary_range) {
            const salary = item.salary_range
            if (salary.min && salary.max) {
              const currency = salary.currency || "USD"
              const period = salary.period || "year"
              salaryText = `${salary.min.toLocaleString()}-${salary.max.toLocaleString()} ${currency} per ${period}`
            }
          }

          // Format job type and experience requirements
          let descriptionText = item.requirements_summary || "Click 'View Details' to learn more."
          if (item.job_type) {
            descriptionText = `${item.job_type}. ${descriptionText}`
          }

          return {
            id: `hirebase-${item._id || index}`,
            title: item.job_title || "Unknown Position",
            company: item.company_name || "Unknown Company",
            location: jobLocation,
            description: descriptionText,
            salary: salaryText,
            postedDate: item.date_posted || new Date().toISOString(),
            url: item.application_link || "#",
            source: "Hirebase",
            logoUrl: item.company_logo || null,
          }
        })
      }
    }

    return []
  }

  // Handle page change for pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > searchState.totalPages || isLoading) return
    handleSearch(newPage)
  }

  // Handle platform change
  const handlePlatformChange = (value: JobPlatform) => {
    setSearchState((prev) => ({
      ...prev,
      platform: value,
      currentPage: 1,
    }))
  }

  // Handle search term change
  const handleSearchTermChange = (value: string) => {
    setSearchState((prevState) => ({
      ...prevState,
      searchTerm: value,
    }))
  }

  // Export jobs to CSV
  const exportToCSV = () => {
    if (filteredJobs.length === 0) {
      toast({
        title: "No jobs to export",
        description: "Search for jobs first before exporting",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const headers = ["Title", "Company", "Location", "URL", "Posted Date", "Source"]

      const jobRows = filteredJobs.map((job) => [
        `"${job.title.replace(/"/g, '""')}"`,
        `"${job.company.replace(/"/g, '""')}"`,
        `"${job.location.replace(/"/g, '""')}"`,
        `"${job.description.replace(/"/g, '""')}"`,
        `"${job.salary.replace(/"/g, '""')}"`,
        `"${new Date(job.postedDate).toLocaleDateString()}"`,
        `"${job.url || ""}"`,
        `"${job.source || ""}"`,
      ])

      const csvContent = [headers.join(","), ...jobRows.map((row) => row.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const platform = searchState.platform
      const searchTerm = searchState.searchTerm.replace(/\s+/g, "-").toLowerCase() || "all-jobs"
      const filename = `${platform}-jobs-${searchTerm}-${timestamp}.csv`

      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.display = "none"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `${filteredJobs.length} jobs exported to CSV`,
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export failed",
        description: "There was a problem exporting the data",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return {
    filteredJobs,
    isLoading,
    isExporting,
    lastFetchTime,
    locationWarning,
    searchState,
    tagState,
    toggleLocationTag,
    toggleJobTag,
    handleRegionSelect,
    toggleAutoFetch,
    handleSearch,
    handlePageChange,
    handlePlatformChange,
    handleSearchTermChange,
    exportToCSV,
  }
}
