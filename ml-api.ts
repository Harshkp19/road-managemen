// API client for the Python ML backend

export interface Junction {
  id: string
  name: string
  latitude: number
  longitude: number
  complexity?: number
}

export interface SafetyPrediction {
  junction_id: string
  risk_level: number // 0: low, 1: medium, 2: high
  risk_probability: number[]
  contributing_factors: Record<string, number>
}

export interface PredictionResponse {
  predictions: SafetyPrediction[]
  model_version: string
  timestamp: string
}

export interface ModelStatus {
  model_loaded: boolean
  version: string | null
  last_updated: string | null
  accuracy: number | null
}

const API_URL = process.env.NEXT_PUBLIC_ML_API_URL || "https://road-safety-ml-api.azurewebsites.net"

// Helper function to check if we're in development/preview mode
const isDevMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost") ||
    (typeof window !== "undefined" && window.location.hostname.includes("vercel.app"))
  )
}

export async function predictSafety(junctions: Junction[]): Promise<PredictionResponse> {
  try {
    // In development/preview, return mock data if API is not available
    if (isDevMode()) {
      try {
        const response = await fetch(`${API_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ junctions }),
        })

        if (response.ok) {
          return await response.json()
        }

        // If API call fails, fall back to mock data
        console.warn("API call failed, using mock prediction data")
        return getMockPredictions(junctions)
      } catch (error) {
        console.warn("API call failed, using mock prediction data:", error)
        return getMockPredictions(junctions)
      }
    }

    // In production, make the actual API call
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ junctions }),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to get safety predictions")
      } else {
        throw new Error(`Failed to get safety predictions: ${response.status} ${response.statusText}`)
      }
    }

    return await response.json()
  } catch (error) {
    console.error("Error predicting safety:", error)
    // In production, we should throw the error
    if (!isDevMode()) {
      throw error
    }
    // In development/preview, return mock data
    return getMockPredictions(junctions)
  }
}

export async function getModelStatus(): Promise<ModelStatus> {
  try {
    // In development/preview, return mock data if API is not available
    if (isDevMode()) {
      try {
        const response = await fetch(`${API_URL}/model/status`)

        if (response.ok) {
          return await response.json()
        }

        // If API call fails, fall back to mock data
        console.warn("API call failed, using mock model status")
        return getMockModelStatus()
      } catch (error) {
        console.warn("API call failed, using mock model status:", error)
        return getMockModelStatus()
      }
    }

    // In production, make the actual API call
    const response = await fetch(`${API_URL}/model/status`)

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to get model status")
      } else {
        throw new Error(`Failed to get model status: ${response.status} ${response.statusText}`)
      }
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting model status:", error)
    // In production, we should throw the error
    if (!isDevMode()) {
      throw error
    }
    // In development/preview, return mock data
    return getMockModelStatus()
  }
}

export async function trainModel(data: any): Promise<{ message: string; job_id: string }> {
  try {
    // In development/preview, return mock data if API is not available
    if (isDevMode()) {
      try {
        const response = await fetch(`${API_URL}/train`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          return await response.json()
        }

        // If API call fails, fall back to mock data
        console.warn("API call failed, using mock training response")
        return { message: "Training job started (mock)", job_id: "mock-job-123" }
      } catch (error) {
        console.warn("API call failed, using mock training response:", error)
        return { message: "Training job started (mock)", job_id: "mock-job-123" }
      }
    }

    // In production, make the actual API call
    const response = await fetch(`${API_URL}/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to train model")
      } else {
        throw new Error(`Failed to train model: ${response.status} ${response.statusText}`)
      }
    }

    return await response.json()
  } catch (error) {
    console.error("Error training model:", error)
    // In production, we should throw the error
    if (!isDevMode()) {
      throw error
    }
    // In development/preview, return mock data
    return { message: "Training job started (mock)", job_id: "mock-job-123" }
  }
}

// Mock data functions
function getMockModelStatus(): ModelStatus {
  return {
    model_loaded: true,
    version: "v1.0.3",
    last_updated: new Date().toISOString(),
    accuracy: 0.87,
  }
}

function getMockPredictions(junctions: Junction[]): PredictionResponse {
  const predictions: SafetyPrediction[] = junctions.map((junction) => {
    // Generate deterministic but varied predictions based on junction ID
    const junctionNumber = Number.parseInt(junction.id.replace(/\D/g, "")) || 1
    const seed = (junctionNumber * 13) % 100

    // Determine risk level (0: low, 1: medium, 2: high)
    let risk_level = 0
    if (seed > 70) risk_level = 2
    else if (seed > 40) risk_level = 1

    // Generate risk probabilities
    const low_prob = risk_level === 0 ? 0.7 + (seed % 30) / 100 : 0.3 - (seed % 20) / 100
    const med_prob = risk_level === 1 ? 0.6 + (seed % 30) / 100 : 0.25 - (seed % 15) / 100
    const high_prob = risk_level === 2 ? 0.5 + (seed % 40) / 100 : 0.2 - (seed % 15) / 100

    // Normalize probabilities to sum to 1
    const total = low_prob + med_prob + high_prob
    const risk_probability = [low_prob / total, med_prob / total, high_prob / total]

    // Generate contributing factors
    const contributing_factors: Record<string, number> = {
      traffic_volume: 0.1 + (seed % 60) / 100,
      weather_conditions: 0.05 + (seed % 40) / 100,
      road_design: 0.15 + (seed % 50) / 100,
      visibility: 0.1 + (seed % 30) / 100,
      signal_timing: 0.05 + (seed % 45) / 100,
      pedestrian_activity: 0.05 + (seed % 35) / 100,
      time_of_day: 0.1 + (seed % 25) / 100,
    }

    return {
      junction_id: junction.id,
      risk_level,
      risk_probability,
      contributing_factors,
    }
  })

  return {
    predictions,
    model_version: "v1.0.3 (mock)",
    timestamp: new Date().toISOString(),
  }
}
