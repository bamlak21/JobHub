"use client"

import { useJobSearch } from "@/hooks/use-job-search"
import { SearchBar } from "@/components/job-search/search-bar"
import { SearchInfo } from "@/components/job-search/search-info"
import { LocationFilter } from "@/components/job-search/location-filter"
import { JobTagFilter } from "@/components/job-search/job-tag-filter"
import { JobList } from "@/components/job-search/job-list"
import type { Job } from "@/lib/types"

export function JobSearch({ initialJobs }: { initialJobs: Job[] }) {
  const {
    filteredJobs,
    isLoading,
    isExporting,
    lastFetchTime,
    locationWarning,
    searchState,
    tagState,
    toggleLocationTag,
    toggleJobTag,
    handleRegionSelect,
    toggleAutoFetch,
    handleSearch,
    handlePageChange,
    handlePlatformChange,
    handleSearchTermChange,
    exportToCSV,
  } = useJobSearch(initialJobs)

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/40">
        <div className="mb-6">
          <SearchBar
            searchTerm={searchState.searchTerm}
            platform={searchState.platform}
            isLoading={isLoading}
            onSearchTermChange={handleSearchTermChange}
            onPlatformChange={handlePlatformChange}
            onSearch={() => handleSearch(1)}
          />

          <SearchInfo
            platform={searchState.platform}
            location={searchState.location.cityLocation}
            lastFetchTime={lastFetchTime}
            locationWarning={locationWarning}
          />
        </div>

        <LocationFilter
          selectedTags={tagState.selectedTags}
          selectedRegion={tagState.selectedRegion}
          showRegions={tagState.showRegions}
          isExporting={isExporting}
          autoFetch={tagState.autoFetch}
          jobsCount={filteredJobs.length}
          onToggleLocationTag={toggleLocationTag}
          onRegionSelect={handleRegionSelect}
          onToggleAutoFetch={toggleAutoFetch}
          onExportCSV={exportToCSV}
        />

        <JobTagFilter selectedTags={tagState.jobTags} onToggleJobTag={toggleJobTag} />
      </div>

      <JobList
        jobs={filteredJobs}
        isLoading={isLoading}
        searchTerm={searchState.searchTerm}
        platform={searchState.platform}
        currentPage={searchState.currentPage}
        totalPages={searchState.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
