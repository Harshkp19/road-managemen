import type { Junction } from "@/types/junction"
import junctionsData from "@/data/junctions.json"
import historicalTrafficData from "@/data/historical-traffic.json"
import weatherData from "@/data/weather-data.json"
import simulationResultsData from "@/data/simulation-results.json"
import { generateMockJunctions } from "@/data/mock-junctions"

// Function to fetch junctions near a location
export async function fetchJunctionsNearLocation(lat: number, lng: number): Promise<Junction[]> {
  try {
    // In a real application, this would call an API endpoint
    // For now, we'll use mock data
    return generateMockJunctions(lat, lng)
  } catch (error) {
    console.error("Error fetching junctions:", error)
    return []
  }
}

// Function to fetch a specific junction by ID
export async function fetchJunctionById(id: string): Promise<Junction> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const junction = junctionsData.find((j) => j.id === id)

  if (!junction) {
    throw new Error(`Junction with ID ${id} not found`)
  }

  return junction
}

// Function to fetch weather data
export async function fetchWeatherData(lat: number, lng: number): Promise<any> {
  // In a real app, this would call the OpenWeatherMap API
  // For demo purposes, we'll return mock data
  await new Promise((resolve) => setTimeout(resolve, 600))

  return weatherData.london
}

// Function to fetch historical traffic data
export async function fetchHistoricalTrafficData(junctionId: string): Promise<any[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  // Return data from our JSON file
  return historicalTrafficData[junctionId] || []
}

// Function to simulate traffic changes
export async function simulateTrafficChanges(junctionId: string, changes: any): Promise<any> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Check if we have pre-computed simulation results
  if (simulationResultsData[junctionId]) {
    return simulationResultsData[junctionId]
  }

  const junction = await fetchJunctionById(junctionId)

  // Generate mock simulation results
  const before = {
    laneWidth: junction.laneWidth,
    speedLimit: junction.speedLimit,
    signalTiming: junction.signalTiming,
    lanes: junction.lanes,
    averageTraffic: junction.currentTrafficCount,
    averageDelay: calculateMockDelay(junction),
    throughput: calculateMockThroughput(junction),
    trafficFlowData: generateMockTrafficFlowData("before", junction),
  }

  // Calculate "after" metrics based on changes
  const laneWidthImpact = (changes.laneWidth - junction.laneWidth) * 20
  const speedLimitImpact = (changes.speedLimit - junction.speedLimit) * 2
  const signalTimingImpact = (junction.signalTiming - changes.signalTiming) * 1.5
  const lanesImpact = changes.additionalLanes * 100

  const totalImpact = laneWidthImpact + speedLimitImpact + signalTimingImpact + lanesImpact

  const after = {
    laneWidth: changes.laneWidth,
    speedLimit: changes.speedLimit,
    signalTiming: changes.signalTiming,
    lanes: junction.lanes + changes.additionalLanes,
    averageTraffic: Math.max(100, Math.round(junction.currentTrafficCount * 0.9 - totalImpact * 0.5)),
    averageDelay: Math.max(5, calculateMockDelay(junction) - totalImpact * 0.1),
    throughput: Math.max(200, calculateMockThroughput(junction) + totalImpact),
    trafficFlowData: generateMockTrafficFlowData("after", junction, totalImpact),
  }

  return { before, after }
}

// Helper function to calculate mock delay
function calculateMockDelay(junction: Junction): number {
  const trafficRatio = junction.currentTrafficCount / junction.capacity
  return Math.round((20 + trafficRatio * 60) * 10) / 10
}

// Helper function to calculate mock throughput
function calculateMockThroughput(junction: Junction): number {
  return Math.round(junction.capacity * 0.8)
}

// Helper function to generate mock traffic flow data
function generateMockTrafficFlowData(type: string, junction: Junction, impact = 0): any[] {
  const data = []
  const now = new Date()

  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)

    // Base traffic count on junction ID and time of day
    const junctionIndex = Number.parseInt(junction.id.replace("j", "")) || 1
    const hourFactor = Math.sin(((i - 6) * Math.PI) / 12) // Peak at 12-1pm
    const baseFactor = junctionIndex * 100 + 300

    let traffic = Math.max(100, Math.round(baseFactor + hourFactor * 300))

    // Adjust "after" traffic based on impact
    if (type === "after" && impact) {
      traffic = Math.max(100, Math.round(traffic - impact * 0.5 * (1 + hourFactor)))
    }

    const before = Math.round(baseFactor * 0.8)

    data.push({
      time: time.toISOString(),
      traffic,
      before,
    })
  }

  return data
}
