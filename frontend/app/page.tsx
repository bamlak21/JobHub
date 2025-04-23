import { JobSearch } from "@/components/job-search"
import { jobData } from "@/lib/data"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto py-1 px-4">
        <div className="text-center mb-2">
          <img src="/neo1.png" alt="Neo" className="mx-auto mb-2" style={{ maxWidth: "300px" }} />
          <p className="text-muted-foreground max-w-md mx-auto -mt-1">
            Search for opportunities exclusively built for the sales team at NILEODE Technologies.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <JobSearch initialJobs={jobData} />
        </div>
      </div>
    </main>
  )
}
