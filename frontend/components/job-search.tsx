"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JobCard } from "@/components/job-card"
import type { Job, SearchState, TagState, JobPlatform } from "@/lib/types"
import {
  Search,
  X,
  Loader2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const countries = ["United States", "United Kingdom", "Canada", "Germany", "Australia", "Remote"]

// Reduced list of top tech states
const topTechStates = [
  "California",
  "Texas",
  "Florida",
  "New York",
  "Washington",
  "Georgia",
  "Illinois",
  "Virginia",
  "Massachusetts",
  "Pennsylvania",
]

const canadaProvinces = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
]

const jobTags = [
  "Software Engineer",
  "Web Developer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "DevOps Engineer",
  "Sales Representative",
  "Marketing Specialist",
  "Project Manager",
  "Business Analyst",
]

export function JobSearch({ initialJobs }: { initialJobs: Job[] }) {
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

  
  useEffect(() => {
    return () => {
      if (autoFetchIntervalRef.current) {
        clearInterval(autoFetchIntervalRef.current)
      }
    }
  }, [])

  
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
    } else {
      setLocationWarning(null)
    }
  }, [searchState.platform, searchState.location.cityLocation])

  
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

  // Toggle auto-fetch feauture
  const toggleAutoFetch = () => {
    setTagState((prev) => ({
      ...prev,
      autoFetch: !prev.autoFetch,
    }))
  }

  
  const getLocationForPlatform = (platform: JobPlatform, location: string): string => {
    if (platform === "dice") {
      
      if (location.includes("USA") || location.includes(", US")) {
        
        return location.split(",")[0].trim()
      } else if (location === "Remote") {
        return "Remote"
      } else {
        // For non-US locations, try to use a more generic term
        return "USA" // Default to USA for better results
      }
    }
    return location
  }

  
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
          hours_old: 72, // Changed from 24 to 12 to match the expected format
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

        let apiJobs: Job[] = []

        if (platform === "indeed") {
          apiJobs = Array.isArray(data)
            ? data.map((item: any[], index: number) => {
                // Indeed format: [company, title, url, date, salary]
                const salary = item[4] && item[4] !== "0-0 nan" ? item[4] : "Salary not specified"

                return {
                  id: `indeed-${index}`,
                  title: item[1] || "Unknown Position",
                  company: item[0] || "Unknown Company",
                  location: location.cityLocation,
                  description: `This job was posted on Indeed. Click "View Details" to learn more.`,
                  salary: salary,
                  postedDate: item[3] || new Date().toISOString(),
                  url: item[2] || "#",
                  source: "Indeed",
                }
              })
            : []
        } else if (platform === "linkedin") {
          // Parse LinkedIn response format (array of arrays)
          apiJobs = Array.isArray(data)
            ? data.map((item: any[], index: number) => {
                // LinkedIn format: [company, title, url, salary, posted_time]
                return {
                  id: `linkedin-${index}`,
                  title: item[1] || "Unknown Position",
                  company: item[0] || "Unknown Company",
                  location: location.cityLocation,
                  description: `This job was posted on LinkedIn. Click "View Details" to learn more.`,
                  salary: item[3] || "Salary not specified",
                  postedDate: new Date().toISOString(), 
                  postedTimeAgo: item[4] || "Recently",
                  url: item[2] || "#",
                  source: "LinkedIn",
                }
              })
            : []

          setSearchState((prev) => ({
            ...prev,
            totalPages: apiJobs.length > 0 ? 10 : 1,
          }))
        } else if (platform === "ziprecruiter") {
          apiJobs = Array.isArray(data)
            ? data.map((item: any[], index: number) => {
                // Assuming ZipRecruiter format is similar to Indeed: [company, title, url, date, salary]
                return {
                  id: `ziprecruiter-${index}`,
                  title: item[1] || "Unknown Position",
                  company: item[0] || "Unknown Company",
                  location: location.cityLocation,
                  description: `This job was posted on ZipRecruiter. Click "View Details" to learn more.`,
                  salary: item[4] || "Salary not specified",
                  postedDate: item[3] || new Date().toISOString(),
                  url: item[2] || "#",
                  source: "ZipRecruiter",
                }
              })
            : []
        } else if (platform === "dice") {
          apiJobs = Array.isArray(data)
            ? data.map((item: any, index: number) => {
          
                const jobLocation = item.location || location.cityLocation

                return {
                  id: `dice-${index}`,
                  title: item.title || "Unknown Position",
                  company: item.company || "Unknown Company",
                  location: jobLocation,
                  description: `${item.employment_type || "Full-time"} position. ${item.post_date || "Recently posted"}.`,
                  salary: item.salary || "Not disclosed",
                  postedDate: new Date().toISOString(),
                  postedTimeAgo: item.post_date || "Recently",
                  url: item.url !== "N/A" ? item.url : "#",
                  source: "Dice",
                }
              })
            : []
        }

        setSearchState((prev) => ({
          ...prev,
          currentPage: pageToUse,
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

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > searchState.totalPages || isLoading) return
    handleSearch(newPage)
  }

  const handlePlatformChange = (value: JobPlatform) => {
    setSearchState((prev) => ({
      ...prev,
      platform: value,
      currentPage: 1,
    }))
  }

  const handleSearchTermChange = (value: string) => {
    setSearchState((prev) => ({
      ...prev,
      searchTerm: value,
    }))
  }

  // Export jobs to CSV by [v0] Thank you v0
  const exportToCSV = () => {
    if (filteredJobs.length === 0) {
      toast({
        title: "No jobs to export",
        description: "Search for jobs first before exporting",
        variant: "destructive",
      })
      return
    }

    // Set loading state for export button
    setIsExporting(true)

    try {
      // CSV header
      const headers = ["Title", "Company", "Location", "URL","Salary", "Posted Date", "Source"]

      // Format job data for CSV
      const jobRows = filteredJobs.map((job) => [
        // Escape quotes and wrap fields with quotes to handle commas
        `"${job.title.replace(/"/g, '""')}"`,
        `"${job.company.replace(/"/g, '""')}"`,
        `"${job.location.replace(/"/g, '""')}"`,
        `"${job.description.replace(/"/g, '""')}"`,
        `"${job.salary.replace(/"/g, '""')}"`,
        `"${new Date(job.postedDate).toLocaleDateString()}"`,
        `"${job.url || ""}"`,
        `"${job.source || ""}"`,
      ])

      // Combine headers and rows
      const csvContent = [headers.join(","), ...jobRows.map((row) => row.join(","))].join("\n")

      // Create a blob with the CSV data
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      // Set link properties
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const platform = searchState.platform
      const searchTerm = searchState.searchTerm.replace(/\s+/g, "-").toLowerCase() || "all-jobs"
      const filename = `${platform}-jobs-${searchTerm}-${timestamp}.csv`

      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.display = "none"

      // Add link to document, click it, and remove it
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

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/40">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Select value={searchState.platform} onValueChange={handlePlatformChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="ziprecruiter">ZipRecruiter</SelectItem>
                <SelectItem value="dice">Dice</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-grow flex items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search for jobs, companies, or keywords..."
                  value={searchState.searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-muted pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(1)
                    }
                  }}
                />
                {searchState.searchTerm && (
                  <Button
                    onClick={() => handleSearchTermChange("")}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button className="ml-2 h-12 px-6" onClick={() => handleSearch(1)} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>
                Searching on: <span className="font-medium text-foreground capitalize">{searchState.platform}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                Location: <span className="font-medium text-foreground">{searchState.location.cityLocation}</span>
              </span>
            </div>

            {lastFetchTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Last updated:{" "}
                  <span className="font-medium text-foreground">{lastFetchTime.toLocaleTimeString()}</span>
                </span>
              </div>
            )}
          </div>

          {locationWarning && (
            <Alert variant="default" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Location Notice</AlertTitle>
              <AlertDescription>{locationWarning}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Filter by location:</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isExporting || filteredJobs.length === 0}
                className="text-xs"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3 mr-1" />
                    Export CSV
                  </>
                )}
              </Button>
              <Button
                variant={tagState.autoFetch ? "default" : "outline"}
                size="sm"
                onClick={toggleAutoFetch}
                className="text-xs"
              >
                {tagState.autoFetch ? "Auto-fetch: ON" : "Auto-fetch: OFF"}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <Badge
                key={country}
                variant={tagState.selectedTags.includes(country) ? "default" : "outline"}
                className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
                  tagState.selectedTags.includes(country) ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                }`}
                onClick={() => toggleLocationTag(country)}
              >
                {country}
              </Badge>
            ))}
          </div>
        </div>

        {tagState.showRegions && (
          <div className="space-y-3 mt-4 border-t pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Select a region in {tagState.selectedTags.includes("United States") ? "United States" : "Canada"}:
            </h2>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {tagState.selectedTags.includes("United States")
                ? topTechStates.map((state) => (
                    <Badge
                      key={state}
                      variant={tagState.selectedRegion === state ? "default" : "outline"}
                      className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
                        tagState.selectedRegion === state ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                      }`}
                      onClick={() => handleRegionSelect(state)}
                    >
                      {state}
                    </Badge>
                  ))
                : canadaProvinces.map((province) => (
                    <Badge
                      key={province}
                      variant={tagState.selectedRegion === province ? "default" : "outline"}
                      className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
                        tagState.selectedRegion === province ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                      }`}
                      onClick={() => handleRegionSelect(province)}
                    >
                      {province}
                    </Badge>
                  ))}
            </div>
          </div>
        )}

        <div className="space-y-3 mt-4 border-t pt-4">
          <h2 className="text-sm font-medium text-muted-foreground">Popular job searches:</h2>
          <div className="flex flex-wrap gap-2">
            {jobTags.map((tag) => (
              <Badge
                key={tag}
                variant={tagState.jobTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
                  tagState.jobTags.includes(tag) ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                }`}
                onClick={() => toggleJobTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <h2 className="text-xl font-semibold">Available Positions</h2>
          <p className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">
            {filteredJobs.length} jobs found
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border/40">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <h3 className="text-xl font-medium mt-2">Searching for jobs...</h3>
              <p className="text-muted-foreground max-w-md">
                We're looking for the best matches for "{searchState.searchTerm}" on {searchState.platform}. This may
                take a moment.
              </p>
            </div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <div className="grid gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {searchState.platform === "linkedin" && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(searchState.currentPage - 1)}
                  disabled={searchState.currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {searchState.currentPage} of {searchState.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(searchState.currentPage + 1)}
                  disabled={searchState.currentPage === searchState.totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border/40">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-xl font-medium mt-2">No jobs found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any jobs matching your search criteria. Try adjusting your filters or search term.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

