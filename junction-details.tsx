"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, CloudRain, Car, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Junction } from "@/types/junction"
import { fetchWeatherData, fetchHistoricalTrafficData } from "@/lib/api"
import { TrafficChart } from "@/components/traffic-chart"

interface JunctionDetailsProps {
  junction: Junction
  onClose: () => void
  onSimulate: (junctionId: string) => void
}

export function JunctionDetails({ junction, onClose, onSimulate }: JunctionDetailsProps) {
  const [weather, setWeather] = useState<any>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Fetch weather data
        const weatherData = await fetchWeatherData(junction.latitude, junction.longitude)
        setWeather(weatherData)

        // Fetch historical traffic data
        const trafficData = await fetchHistoricalTrafficData(junction.id)
        setHistoricalData(trafficData)
      } catch (error) {
        console.error("Error loading junction data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [junction])

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

  const getTrafficReasonIcon = (reason: string) => {
    switch (reason.toLowerCase()) {
      case "weather":
        return <CloudRain className="h-5 w-5" />
      case "accident":
        return <AlertTriangle className="h-5 w-5" />
      case "volume":
        return <Car className="h-5 w-5" />
      default:
        return <Car className="h-5 w-5" />
    }
  }

  return (
    <Card className="border-0 rounded-none h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">{junction.name}</CardTitle>
          <CardDescription>Junction ID: {junction.id}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      {loading ? (
        <CardContent className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      ) : (
        <>
          <CardContent className="flex-1 overflow-auto">
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
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
                  {junction.trafficLevel} Traffic
                </span>
              </div>

              {junction.trafficReasons && junction.trafficReasons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Contributing Factors:</p>
                  <ul className="space-y-2">
                    {junction.trafficReasons.map((reason, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        {getTrafficReasonIcon(reason.type)}
                        <span>{reason.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {weather && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Current Weather:</p>
                <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-md">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    className="h-12 w-12"
                  />
                  <div>
                    <p className="font-medium">{weather.weather[0].main}</p>
                    <p className="text-sm">
                      {Math.round(weather.main.temp)}°C, {weather.weather[0].description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Tabs defaultValue="live">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="live">Live Count</TabsTrigger>
                <TabsTrigger value="historical">Historical Data</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Current Traffic</p>
                    <p className="text-2xl font-bold">{junction.currentTrafficCount} vehicles</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                    <p className="text-2xl font-bold">{junction.capacity} vehicles</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Utilization</p>
                  <div className="w-full bg-secondary rounded-full h-2.5 mt-2 mb-1">
                    <div
                      className={`h-2.5 rounded-full ${getTrafficLevelClass(junction.trafficLevel)}`}
                      style={{ width: `${(junction.currentTrafficCount / junction.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">
                      {Math.round((junction.currentTrafficCount / junction.capacity) * 100)}% of capacity
                    </p>
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="historical" className="pt-4">
                {historicalData.length > 0 ? (
                  <TrafficChart data={historicalData} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No historical data available</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter>
            <Button className="w-full" onClick={() => onSimulate(junction.id)}>
              Simulate Traffic Optimization
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
