"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { countries, topTechStates, canadaProvinces } from "@/lib/location-data"

interface LocationFilterProps {
  selectedTags: string[]
  selectedRegion: string
  showRegions: boolean
  isExporting: boolean
  autoFetch: boolean
  jobsCount: number
  onToggleLocationTag: (tag: string) => void
  onRegionSelect: (region: string) => void
  onToggleAutoFetch: () => void
  onExportCSV: () => void
}

export function LocationFilter({
  selectedTags,
  selectedRegion,
  showRegions,
  isExporting,
  autoFetch,
  jobsCount,
  onToggleLocationTag,
  onRegionSelect,
  onToggleAutoFetch,
  onExportCSV,
}: LocationFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Filter by location:</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            disabled={isExporting || jobsCount === 0}
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
          <Button variant={autoFetch ? "default" : "outline"} size="sm" onClick={onToggleAutoFetch} className="text-xs">
            {autoFetch ? "Auto-fetch: ON" : "Auto-fetch: OFF"}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {countries.map((country) => (
          <Badge
            key={country}
            variant={selectedTags.includes(country) ? "default" : "outline"}
            className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
              selectedTags.includes(country) ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
            }`}
            onClick={() => onToggleLocationTag(country)}
          >
            {country}
          </Badge>
        ))}
      </div>

      {showRegions && (
        <div className="space-y-3 mt-4 border-t pt-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Select a region in {selectedTags.includes("United States") ? "United States" : "Canada"}:
          </h2>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {selectedTags.includes("United States")
              ? topTechStates.map((state) => (
                  <Badge
                    key={state}
                    variant={selectedRegion === state ? "default" : "outline"}
                    className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
                      selectedRegion === state ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                    }`}
                    onClick={() => onRegionSelect(state)}
                  >
                    {state}
                  </Badge>
                ))
              : canadaProvinces.map((province) => (
                  <Badge
                    key={province}
                    variant={selectedRegion === province ? "default" : "outline"}
                    className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
                      selectedRegion === province ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                    }`}
                    onClick={() => onRegionSelect(province)}
                  >
                    {province}
                  </Badge>
                ))}
          </div>
        </div>
      )}
    </div>
  )
}
