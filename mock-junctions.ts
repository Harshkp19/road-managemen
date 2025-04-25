import type { Junction } from "@/types/junction"

// Traffic levels to cycle through
const trafficLevels = ["low", "medium", "high"]

// Generate mock junctions for when no real data is available
export function generateMockJunctions(lat: number, lng: number, count = 5): Junction[] {
  const junctions: Junction[] = []

  for (let i = 0; i < count; i++) {
    // Create slight variations in location
    const latOffset = (Math.random() - 0.5) * 0.01
    const lngOffset = (Math.random() - 0.5) * 0.01

    // Cycle through traffic levels
    const trafficLevel = trafficLevels[i % trafficLevels.length]

    // Generate capacity and current traffic based on traffic level
    const capacity = 500 + Math.floor(Math.random() * 500)
    let currentTrafficCount

    switch (trafficLevel) {
      case "high":
        currentTrafficCount = Math.floor(capacity * (0.8 + Math.random() * 0.2))
        break
      case "medium":
        currentTrafficCount = Math.floor(capacity * (0.5 + Math.random() * 0.3))
        break
      default: // low
        currentTrafficCount = Math.floor(capacity * (0.1 + Math.random() * 0.4))
    }

    junctions.push({
      id: `j${i + 1}`,
      name: `Junction ${i + 1}`,
      latitude: lat + latOffset,
      longitude: lng + lngOffset,
      trafficLevel,
      capacity,
      currentTrafficCount,
      lanes: 2 + Math.floor(Math.random() * 4),
      signalTiming: 30 + Math.floor(Math.random() * 60),
      speedLimit: 30 + Math.floor(Math.random() * 30),
      laneWidth: 3 + Math.floor(Math.random() * 2),
      type: Math.random() > 0.5 ? "roundabout" : "signalized",
    })
  }

  return junctions
}
