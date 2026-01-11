"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { SearchConfig, WorkPreference } from "@/lib/types"

interface SearchConfigProps {
  config: SearchConfig
  onConfigChange: (config: SearchConfig) => void
}

export function SearchConfigForm({ config, onConfigChange }: SearchConfigProps) {
  const [targetRoles, setTargetRoles] = useState(config.targetRoles.join(", "))
  const [locations, setLocations] = useState(config.locations.join(", "))
  const [excludeCompanies, setExcludeCompanies] = useState(config.excludeCompanies.join(", "))
  const [salaryMin, setSalaryMin] = useState(config.salaryRange?.min ? config.salaryRange.min.toString() : "")
  const [salaryMax, setSalaryMax] = useState(config.salaryRange?.max ? config.salaryRange.max.toString() : "")
  const [radius, setRadius] = useState(config.radius?.toString() ?? "10")

  const updateConfig = (updates: Partial<SearchConfig>) => {
    onConfigChange({ ...config, ...updates })
  }

  const parseList = (value: string) =>
    value.split(",").map((s) => s.trim()).filter(Boolean)

  const updateSalaryRange = () => {
    const min = salaryMin ? Number.parseInt(salaryMin) : 0
    const max = salaryMax ? Number.parseInt(salaryMax) : 0
    // Only set salaryRange if user actually entered values
    if (salaryMin || salaryMax) {
      updateConfig({ salaryRange: { min, max: max || 0 } })
    } else {
      updateConfig({ salaryRange: null })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Search Preferences</h3>
        <p className="text-sm text-muted-foreground">Tell us what kind of roles you're looking for</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetRoles">Target Roles (comma-separated)</Label>
        <Input
          id="targetRoles"
          placeholder="ML Engineer, AI Engineer, Machine Learning Scientist"
          value={targetRoles}
          onChange={(e) => setTargetRoles(e.target.value)}
          onBlur={() => updateConfig({ targetRoles: parseList(targetRoles) })}
        />
        <p className="text-xs text-muted-foreground">We'll search for these job titles</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locations">Locations (comma-separated, or leave blank for all)</Label>
        <Input
          id="locations"
          placeholder="San Francisco, New York, Remote"
          value={locations}
          onChange={(e) => setLocations(e.target.value)}
          onBlur={() => updateConfig({ locations: parseList(locations) })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="radius">Search Radius (miles)</Label>
        <Input
          id="radius"
          type="number"
          placeholder="10"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          onBlur={() => updateConfig({ radius: Number.parseInt(radius) || 10 })}
          className="w-24"
        />
        <p className="text-xs text-muted-foreground">Distance from location for hybrid/onsite jobs</p>
      </div>

      <div className="space-y-3">
        <Label>Work Preference</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="any"
              checked={config.workPreferences.length === 3}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateConfig({ workPreferences: ["remote", "hybrid", "onsite"] })
                } else {
                  updateConfig({ workPreferences: [] })
                }
              }}
            />
            <Label htmlFor="any" className="font-normal cursor-pointer">
              Any
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote"
              checked={config.workPreferences.includes("remote")}
              onCheckedChange={(checked) => {
                const prefs = checked
                  ? [...config.workPreferences, "remote" as WorkPreference]
                  : config.workPreferences.filter((p) => p !== "remote")
                updateConfig({ workPreferences: prefs })
              }}
            />
            <Label htmlFor="remote" className="font-normal cursor-pointer">
              Remote
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hybrid"
              checked={config.workPreferences.includes("hybrid")}
              onCheckedChange={(checked) => {
                const prefs = checked
                  ? [...config.workPreferences, "hybrid" as WorkPreference]
                  : config.workPreferences.filter((p) => p !== "hybrid")
                updateConfig({ workPreferences: prefs })
              }}
            />
            <Label htmlFor="hybrid" className="font-normal cursor-pointer">
              Hybrid
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="onsite"
              checked={config.workPreferences.includes("onsite")}
              onCheckedChange={(checked) => {
                const prefs = checked
                  ? [...config.workPreferences, "onsite" as WorkPreference]
                  : config.workPreferences.filter((p) => p !== "onsite")
                updateConfig({ workPreferences: prefs })
              }}
            />
            <Label htmlFor="onsite" className="font-normal cursor-pointer">
              On-site
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Salary Range (optional)</Label>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Min (e.g. 120000)"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              onBlur={updateSalaryRange}
            />
          </div>
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Max (e.g. 200000)"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              onBlur={updateSalaryRange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excludeCompanies">Companies to Exclude (optional)</Label>
        <Textarea
          id="excludeCompanies"
          placeholder="Company A, Company B"
          value={excludeCompanies}
          onChange={(e) => setExcludeCompanies(e.target.value)}
          onBlur={() => updateConfig({ excludeCompanies: parseList(excludeCompanies) })}
          className="min-h-[80px]"
        />
      </div>
    </div>
  )
}
