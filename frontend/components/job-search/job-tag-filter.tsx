"use client"

import { Badge } from "@/components/ui/badge"
import { jobTags } from "@/lib/location-data"

interface JobTagFilterProps {
  selectedTags: string[]
  onToggleJobTag: (tag: string) => void
}

export function JobTagFilter({ selectedTags, onToggleJobTag }: JobTagFilterProps) {
  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      <h2 className="text-sm font-medium text-muted-foreground">Popular job searches:</h2>
      <div className="flex flex-wrap gap-2">
        {jobTags.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all ${
              selectedTags.includes(tag) ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
            }`}
            onClick={() => onToggleJobTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
