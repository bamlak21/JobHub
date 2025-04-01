import { JobSearch } from "@/components/job-search"
import { jobData } from "@/lib/data"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto py-10 px-4">
        <div className="text-center mb-2"> 
          
          <img 
            src="/neo.png" 
            alt="Neo" 
            className="mx-auto mb-1 mt-1" 
            style={{ maxWidth: '250px' }} 
          />
          <p className="text-muted-foreground max-w-md mx-auto">
            Search thousands of job opportunities from top companies around the world
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <JobSearch initialJobs={jobData} />
        </div>
      </div>
    </main>
  )
}
