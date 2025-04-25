export interface TrafficReason {
  type: string
  description: string
}

export interface Junction {
  id: string
  name: string
  latitude: number
  longitude: number
  trafficLevel: string
  currentTrafficCount: number
  capacity: number
  trafficReasons: TrafficReason[]
  laneWidth?: number
  speedLimit?: number
  signalTiming?: number
  lanes?: number
}
