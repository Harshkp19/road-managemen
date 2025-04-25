"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { TrafficChart } from "@/components/traffic-chart"

interface SimulationResultProps {
  before: any
  after: any
}

export function SimulationResult({ before, after }: SimulationResultProps) {
  const calculateChange = (beforeValue: number, afterValue: number) => {
    const diff = afterValue - beforeValue
    const percentChange = (diff / beforeValue) * 100

    return {
      value: diff,
      percent: percentChange,
      improved: diff < 0, // For traffic, lower is better
    }
  }

  const trafficChange = calculateChange(before.averageTraffic, after.averageTraffic)
  const delayChange = calculateChange(before.averageDelay, after.averageDelay)
  const throughputChange = calculateChange(before.throughput, after.throughput)

  // Invert throughput change since higher throughput is better
  throughputChange.improved = !throughputChange.improved

  const getChangeIcon = (improved: boolean) => {
    if (improved) {
      return <ArrowDown className="h-4 w-4 text-green-500" />
    } else {
      return <ArrowUp className="h-4 w-4 text-red-500" />
    }
  }

  const getChangeColor = (improved: boolean) => {
    return improved ? "text-green-500" : "text-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Results</CardTitle>
        <CardDescription>Comparison of traffic metrics before and after proposed changes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="metrics">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="chart">Traffic Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Traffic</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{after.averageTraffic}</div>
                    <div className={`text-sm flex items-center ${getChangeColor(trafficChange.improved)}`}>
                      {Math.abs(trafficChange.percent).toFixed(1)}%
                      {trafficChange.value !== 0 ? (
                        getChangeIcon(trafficChange.improved)
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">vehicles/hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Delay</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{after.averageDelay.toFixed(1)}</div>
                    <div className={`text-sm flex items-center ${getChangeColor(delayChange.improved)}`}>
                      {Math.abs(delayChange.percent).toFixed(1)}%
                      {delayChange.value !== 0 ? getChangeIcon(delayChange.improved) : <Minus className="h-4 w-4" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">seconds/vehicle</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Throughput</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{after.throughput}</div>
                    <div className={`text-sm flex items-center ${getChangeColor(throughputChange.improved)}`}>
                      {Math.abs(throughputChange.percent).toFixed(1)}%
                      {throughputChange.value !== 0 ? (
                        throughputChange.improved ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        )
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">vehicles/hour</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">Before vs After Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Before Changes</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Lane Width:</span>
                          <span>{before.laneWidth}m</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Speed Limit:</span>
                          <span>{before.speedLimit} mph</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Signal Timing:</span>
                          <span>{before.signalTiming}s</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Number of Lanes:</span>
                          <span>{before.lanes}</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">After Changes</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Lane Width:</span>
                          <span>{after.laneWidth}m</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Speed Limit:</span>
                          <span>{after.speedLimit} mph</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Signal Timing:</span>
                          <span>{after.signalTiming}s</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Number of Lanes:</span>
                          <span>{after.lanes}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart" className="pt-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">Traffic Flow Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <TrafficChart data={after.trafficFlowData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
