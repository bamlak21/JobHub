"use client"

import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { JobPlatform } from "@/lib/types"

interface SearchBarProps {
  searchTerm: string
  platform: JobPlatform
  isLoading: boolean
  onSearchTermChange: (value: string) => void
  onPlatformChange: (value: JobPlatform) => void
  onSearch: () => void
}

export function SearchBar({
  searchTerm,
  platform,
  isLoading,
  onSearchTermChange,
  onPlatformChange,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <Select value={platform} onValueChange={onPlatformChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Select Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="indeed">Indeed</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
          <SelectItem value="ziprecruiter">ZipRecruiter</SelectItem>
          <SelectItem value="dice">Dice</SelectItem>
          <SelectItem value="hirebase">Hirebase</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-grow flex items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search for jobs, companies, or keywords..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 h-12 bg-background/50 border-muted pr-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch()
              }
            }}
          />
          {searchTerm && (
            <Button
              onClick={() => onSearchTermChange("")}
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button className="ml-2 h-12 px-6" onClick={onSearch} disabled={isLoading}>
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
  )
}
