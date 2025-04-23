import type { ReactNode } from "react"

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary: string
  postedDate: string
  logo?: ReactNode
  url?: string
  source?: string
  logoUrl?: string | null
}

export interface SearchState {
  searchTerm: string
  location: {
    country: string
    region: string
    cityLocation: string
    apiLocation: string
  }
  platform: JobPlatform
  currentPage: number
  totalPages: number
}

export interface TagState {
  selectedTags: string[]
  jobTags: string[]
  showRegions: boolean
  selectedRegion: string
  autoFetch: boolean
}

export type JobPlatform = "indeed" | "linkedin" | "ziprecruiter" | "dice"

