"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JobCard } from "@/components/job-card"
import type { Job } from "@/lib/types"
import { Search, X, Loader2, Briefcase, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type JobPlatform = "indeed" | "linkedin" | "ziprecruiter"

const countries = ["United States", "United Kingdom", "Canada", "Germany", "Australia", "India", "Remote"]

export function JobSearch({ initialJobs }: { initialJobs: Job[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(initialJobs)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState("usa") 
  const [platform, setPlatform] = useState<JobPlatform>("indeed")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cityLocation, setCityLocation] = useState("San Francisco, CA") 

  useEffect(() => {
    
    const filtered = initialJobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTags = selectedTags.length === 0 || selectedTags.includes(job.location)

      return matchesSearch && matchesTags
    })

    setFilteredJobs(filtered)
  }, [searchTerm, selectedTags, initialJobs])

  
  useEffect(() => {
    setCurrentPage(1)
  }, [platform])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const isTagSelected = prev.includes(tag)
      const updatedTags = isTagSelected ? prev.filter((t) => t !== tag) : [...prev, tag]

     
      if (!isTagSelected) {
        
        let apiLocation = "usa"
        let cityLoc = "San Francisco, CA" 

        if (tag === "United States") {
          apiLocation = "usa"
          cityLoc = "San Francisco, CA"
        } else if (tag === "United Kingdom") {
          apiLocation = "uk"
          cityLoc = "London, UK"
        } else if (tag === "Canada") {
          apiLocation = "canada"
          cityLoc = "Toronto, Canada"
        } else if (tag === "Germany") {
          apiLocation = "germany"
          cityLoc = "Berlin, Germany"
        } else if (tag === "Australia") {
          apiLocation = "australia"
          cityLoc = "Sydney, Australia"
        } else if (tag === "India") {
          apiLocation = "india"
          cityLoc = "Bangalore, India"
        } else if (tag === "Remote") {
          apiLocation = "remote"
          cityLoc = "Remote"
        }

        setLocation(apiLocation)
        setCityLocation(cityLoc)
      }

      return updatedTags
    })
  }

  const handleSearch = async (page = currentPage) => {
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
        google_search_term: `${searchTerm} jobs near ${cityLocation} since yesterday`,
        location: cityLocation,
        results_wanted: 20,
        hours_old: 24,
        country_indeed: location.toUpperCase() === "USA" ? "USA" : location.toUpperCase(),
      }

      
      if (platform === "indeed") {
        endpoint = "/api/indeed"
        requestBody = indeedZipBody
      } else if (platform === "linkedin") {
        endpoint = "/api/linkedin"
        requestBody = {
          skill: searchTerm,
          location: location,
          pagenumber: page,
        }
      } else if (platform === "ziprecruiter") {
        endpoint = "/api/ziprecruiter"
        requestBody = indeedZipBody
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
              // New Indeed format: [company, title, url, date, salary]
              return {
                id: `indeed-${index}`,
                title: item[1] || "Unknown Position",
                company: item[0] || "Unknown Company",
                location: cityLocation,
                description: `This job was posted on Indeed. Click "View Details" to learn more.`,
                salary: item[4] || "Salary not specified",
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
                location: cityLocation,
                description: `This job was posted on LinkedIn. Click "View Details" to learn more.`,
                salary: item[3] || "Salary not specified",
                postedDate: new Date().toISOString(), // Convert relative time to date
                postedTimeAgo: item[4] || "Recently",
                url: item[2] || "#",
                source: "LinkedIn",
              }
            })
          : []

        
        setTotalPages(apiJobs.length > 0 ? 10 : 1) 
      } else if (platform === "ziprecruiter") {
        
        apiJobs = Array.isArray(data)
          ? data.map((item: any[], index: number) => {
              // Assuming ZipRecruiter format is similar to Indeed: [company, title, url, date, salary]
              return {
                id: `ziprecruiter-${index}`,
                title: item[1] || "Unknown Position",
                company: item[0] || "Unknown Company",
                location: cityLocation,
                description: `This job was posted on ZipRecruiter. Click "View Details" to learn more.`,
                salary: item[4] || "Salary not specified",
                postedDate: item[3] || new Date().toISOString(),
                url: item[2] || "#",
                source: "ZipRecruiter",
              }
            })
          : []
      }

      setCurrentPage(page)
      setFilteredJobs(apiJobs)

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
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isLoading) return
    setCurrentPage(newPage)
    handleSearch(newPage)
  }

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/40">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Select value={platform} onValueChange={(value: JobPlatform) => setPlatform(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="ziprecruiter">ZipRecruiter</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-grow flex items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search for jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-muted pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(1) 
                    }
                  }}
                />
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                className="ml-2 h-12 px-6"
                onClick={() => handleSearch(1)} 
                disabled={isLoading}
              >
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

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>
                Searching on: <span className="font-medium text-foreground capitalize">{platform}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                Location: <span className="font-medium text-foreground">{cityLocation}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Filter by location:</h2>
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <Badge
                key={country}
                variant={selectedTags.includes(country) ? "default" : "outline"}
                className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
                  selectedTags.includes(country) ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                }`}
                onClick={() => toggleTag(country)}
              >
                {country}
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
                We're looking for the best matches for "{searchTerm}" on {platform}. This may take a moment.
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

            {platform === "linkedin" && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
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

