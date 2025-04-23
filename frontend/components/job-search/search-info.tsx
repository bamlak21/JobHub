import { Briefcase, MapPin, Clock } from "lucide-react"
import { Alert, AlertCircle, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SearchInfoProps {
  platform: string
  location: string
  lastFetchTime: Date | null
  locationWarning: string | null
}

export function SearchInfo({ platform, location, lastFetchTime, locationWarning }: SearchInfoProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          <span>
            Searching on: <span className="font-medium text-foreground capitalize">{platform}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            Location: <span className="font-medium text-foreground">{location}</span>
          </span>
        </div>

        {lastFetchTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Last updated: <span className="font-medium text-foreground">{lastFetchTime.toLocaleTimeString()}</span>
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
    </>
  )
}
