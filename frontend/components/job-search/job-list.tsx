"use client"

import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobCard } from "@/components/job-card"
import type { Job } from "@/lib/types"

interface JobListProps {
  jobs: Job[]
  isLoading: boolean
  searchTerm: string
  platform: string
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function JobList({
  jobs,
  isLoading,
  searchTerm,
  platform,
  currentPage,
  totalPages,
  onPageChange,
}: JobListProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border/40 pb-3">
        <h2 className="text-xl font-semibold">Available Positions</h2>
        <p className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">{jobs.length} jobs found</p>
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
      ) : jobs.length > 0 ? (
        <>
          <div className="grid gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {platform === "linkedin" && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
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
                onClick={() => onPageChange(currentPage + 1)}
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
  )
}
