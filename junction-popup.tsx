"use client"

import { Button } from "@/components/ui/button"
import type { Junction } from "@/types/junction"

interface JunctionPopupProps {
  junction: Junction
  onViewDetails: (junctionId: string) => void
}

export function JunctionPopup({ junction, onViewDetails }: JunctionPopupProps) {
  const getTrafficLevelClass = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="p-2 max-w-[300px]">
      <div className="font-bold text-lg">{junction.name}</div>
      <div className="text-sm mb-2">Junction ID: {junction.id}</div>

      <div className="flex items-center space-x-2 mb-3">
        <div className={`h-4 w-4 rounded-full ${getTrafficLevelClass(junction.trafficLevel)}`}></div>
        <span
          className={`font-medium ${
            junction.trafficLevel.toLowerCase() === "high"
              ? "text-red-500"
              : junction.trafficLevel.toLowerCase() === "medium"
                ? "text-yellow-500"
                : "text-green-500"
          }`}
        >
          {junction.trafficLevel.charAt(0).toUpperCase() + junction.trafficLevel.slice(1)} Traffic
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-muted/50 p-2 rounded-md">
          <p className="text-xs text-muted-foreground">Current Traffic</p>
          <div className="flex items-center justify-between">
            <p className="font-bold">{junction.currentTrafficCount} vehicles</p>
            <div className={`h-2 w-2 rounded-full ${getTrafficLevelClass(junction.trafficLevel)}`}></div>
          </div>
        </div>
        <div className="bg-muted/50 p-2 rounded-md">
          <p className="text-xs text-muted-foreground">Capacity</p>
          <p className="font-bold">{junction.capacity} vehicles</p>
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full ${getTrafficLevelClass(junction.trafficLevel)}`}
          style={{ width: `${(junction.currentTrafficCount / junction.capacity) * 100}%` }}
        ></div>
        <p className="text-xs text-right mt-1">
          {Math.round((junction.currentTrafficCount / junction.capacity) * 100)}% of capacity
        </p>
      </div>

      <Button className="w-full" size="sm" onClick={() => onViewDetails(junction.id)}>
        View Details
      </Button>
    </div>
  )
}
