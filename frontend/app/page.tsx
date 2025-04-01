import { JobSearch } from "@/components/job-search"
import { jobData } from "@/lib/data"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto py-1 px-4">
        <div className="text-center mb-2">
          <img src="/neo.png" alt="Neo" className="mx-auto mb-2" style={{ maxWidth: "200px" }} />
          <p className="text-muted-foreground max-w-md mx-auto -mt-1">
            Search thousands of job opportunities from top companies around the world
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <JobSearch initialJobs={jobData} />
        </div>
      </div>
    </main>
  )
}

