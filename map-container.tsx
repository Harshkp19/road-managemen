"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, AlertCircle, Info } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import type { Junction } from "@/types/junction"
import { fetchJunctionsNearLocation } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

declare global {
  interface Window {
    google: any
    initGoogleMap?: () => void
  }
}

// Default locations for fallback
const DEFAULT_LOCATIONS = [
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
]

// Traffic reasons based on traffic level
const trafficReasons = {
  high: [
    "Rush hour congestion",
    "Road construction ahead",
    "Traffic accident reported",
    "Event in the area",
    "Lane closure",
  ],
  medium: [
    "Moderate commuter traffic",
    "Slow moving vehicles",
    "Partial lane restriction",
    "Weather conditions",
    "School zone active",
  ],
  low: [
    "Normal traffic flow",
    "Light traffic conditions",
    "Clear roadway",
    "Off-peak hours",
    "Good driving conditions",
  ],
}

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJunction, setSelectedJunction] = useState<Junction | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [junctions, setJunctions] = useState<Junction[]>([])
  const [loading, setLoading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const isMobile = useMobile()
  const googleMapsScriptRef = useRef<HTMLScriptElement | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      if (!mapRef.current) return

      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          if (isMounted) initializeMap()
          return
        }

        // Check if script is already being loaded by another component
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]')

        if (existingScript) {
          // If script exists but Google isn't defined yet, wait for it
          const checkGoogleExists = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(checkGoogleExists)
              if (isMounted) initializeMap()
            }
          }, 100)

          // Clear interval after 10 seconds to prevent infinite checking
          setTimeout(() => clearInterval(checkGoogleExists), 10000)
          return
        }

        // Load Google Maps script
        const googleMapsScript = document.createElement("script")

        // Use the provided API key for testing
        // In production, you should use: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        const apiKey = "AIzaSyBAno-WYdnkA0bpCqAKoCiqzjFLIgjAX-E"

        googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        googleMapsScript.async = true
        googleMapsScript.defer = true
        googleMapsScriptRef.current = googleMapsScript

        // Handle script load
        googleMapsScript.onload = () => {
          if (isMounted) initializeMap()
        }

        // Handle script load errors
        googleMapsScript.onerror = () => {
          console.error("Failed to load Google Maps script")
          if (isMounted) {
            setMapError("Failed to load Google Maps. Using fallback map.")
            initializeFallbackMap()
          }
        }

        document.head.appendChild(googleMapsScript)
      } catch (error) {
        console.error("Error initializing map:", error)
        if (isMounted) {
          setMapError("An error occurred while loading the map. Using fallback map.")
          initializeFallbackMap()
        }
      }
    }

    const initializeMap = () => {
      try {
        if (!window.google || !window.google.maps) {
          setMapError("Google Maps failed to load. Using fallback map.")
          initializeFallbackMap()
          return
        }

        const mapInstance = new window.google.maps.Map(mapRef.current!, {
          center: { lat: 51.5074, lng: -0.1278 }, // London as default
          zoom: 13,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        })

        // Create info window for popups
        const infoWindowInstance = new window.google.maps.InfoWindow({
          maxWidth: 350,
        })

        setMap(mapInstance)
        setInfoWindow(infoWindowInstance)
        setMapError(null)

        // Load initial junctions for London
        handleInitialJunctionsLoad({ lat: 51.5074, lng: -0.1278 })
      } catch (error) {
        console.error("Error creating map instance:", error)
        setMapError("Failed to initialize Google Maps. Using fallback map.")
        initializeFallbackMap()
      }
    }

    const initializeFallbackMap = () => {
      // Create a simple fallback map using a static UI
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full bg-muted/30 p-4">
            <div class="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
              <div class="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-8 w-8 mr-2 text-primary"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                <h2 class="text-xl font-bold">Road Management Map</h2>
              </div>
              <p class="mb-4">The interactive map is currently unavailable. Please check your API configuration.</p>
              <div class="bg-muted p-3 rounded-md text-sm">
                <p class="font-medium mb-1">Troubleshooting:</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>Verify your Google Maps API key is correct</li>
                  <li>Ensure the Maps JavaScript API is enabled in your Google Cloud Console</li>
                  <li>Check for any domain restrictions on your API key</li>
                </ul>
              </div>
            </div>
          </div>
        `
      }
    }

    initMap()

    return () => {
      isMounted = false

      // Clean up markers
      if (map && map.get("markers")) {
        map.get("markers").forEach((marker: google.maps.Marker) => {
          if (marker) marker.setMap(null)
        })
      }

      // Don't remove the script if it might be used by other components
      // We'll manage script loading more carefully
    }
  }, [])

  // Load initial junctions
  const handleInitialJunctionsLoad = async (location: { lat: number; lng: number }) => {
    if (!map) return

    try {
      // Fetch junctions near London by default
      const fetchedJunctions = await fetchJunctionsNearLocation(location.lat, location.lng)

      if (fetchedJunctions.length === 0) {
        toast({
          title: "No junctions found",
          description: "No traffic junctions were found in this area.",
          variant: "default",
        })
        return
      }

      setJunctions(fetchedJunctions)

      // Add markers for each junction
      addJunctionMarkers(fetchedJunctions)

      // Auto-open the first junction's popup
      if (fetchedJunctions.length > 0) {
        setTimeout(() => {
          showJunctionPopup(fetchedJunctions[0])
        }, 500)
      }
    } catch (error) {
      console.error("Error loading initial junctions:", error)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!map || !searchQuery) return

    setLoading(true)

    try {
      const geocoder = new window.google.maps.Geocoder()

      geocoder.geocode({ address: searchQuery }, async (results, status) => {
        if (status === "OK" && results && results[0]) {
          // Successful geocoding
          const location = results[0].geometry.location
          handleSuccessfulSearch(location.lat(), location.lng())
        } else {
          // Handle geocoding error
          console.error("Geocode was not successful for the following reason:", status)

          // Try to handle common location names directly
          const knownLocation = searchQuery.toLowerCase().trim()
          const fallbackLocation = DEFAULT_LOCATIONS.find((loc) => loc.name.toLowerCase() === knownLocation)

          if (fallbackLocation) {
            // Use our fallback location data
            toast({
              title: "Using approximate location",
              description: `Showing results for ${fallbackLocation.name}.`,
              variant: "default",
            })
            handleSuccessfulSearch(fallbackLocation.lat, fallbackLocation.lng)
          } else {
            // No fallback found, use default location
            toast({
              title: "Location not found",
              description: "Could not find the location you searched for. Showing default location instead.",
              variant: "warning",
            })
            handleSuccessfulSearch(51.5074, -0.1278) // Default to London
          }
        }
      })
    } catch (error) {
      console.error("Error searching location:", error)
      toast({
        title: "Search error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Handle successful search (either from geocoding or fallback)
  const handleSuccessfulSearch = async (lat: number, lng: number) => {
    if (!map) {
      setLoading(false)
      return
    }

    try {
      // Center map on location
      map.setCenter({ lat, lng })
      map.setZoom(14)

      // Fetch junctions near this location
      const fetchedJunctions = await fetchJunctionsNearLocation(lat, lng)

      if (fetchedJunctions.length === 0) {
        // Generate mock junctions if none found
        const mockJunctions = generateMockJunctions(lat, lng, 5)
        setJunctions(mockJunctions)
        addJunctionMarkers(mockJunctions)

        // Auto-open the first junction's popup
        if (mockJunctions.length > 0) {
          setTimeout(() => {
            showJunctionPopup(mockJunctions[0])
          }, 500)
        }

        toast({
          title: "Using simulated data",
          description: "No real traffic junctions were found. Showing simulated junctions instead.",
          variant: "default",
        })
      } else {
        setJunctions(fetchedJunctions)
        addJunctionMarkers(fetchedJunctions)

        // Auto-open the first junction's popup
        if (fetchedJunctions.length > 0) {
          setTimeout(() => {
            showJunctionPopup(fetchedJunctions[0])
          }, 500)
        }
      }
    } catch (error) {
      console.error("Error processing search results:", error)
      toast({
        title: "Error loading junctions",
        description: "Failed to load junction data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate mock junctions for when no real data is available
  const generateMockJunctions = (lat: number, lng: number, count = 5): Junction[] => {
    const junctions: Junction[] = []

    // Traffic levels to cycle through
    const trafficLevels = ["low", "medium", "high"]

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

  // Add markers for junctions
  const addJunctionMarkers = (junctions: Junction[]) => {
    if (!map || !window.google) return

    // Clear any existing markers
    if (map.get("markers")) {
      map.get("markers").forEach((marker: google.maps.Marker) => {
        if (marker) marker.setMap(null)
      })
    }

    const markers: google.maps.Marker[] = []

    // Add markers for each junction
    junctions.forEach((junction) => {
      const marker = new window.google.maps.Marker({
        position: { lat: junction.latitude, lng: junction.longitude },
        map: map,
        title: junction.name,
        animation: window.google.maps.Animation.DROP,
        icon: getMarkerIconByTrafficLevel(junction.trafficLevel),
      })

      marker.addListener("click", () => {
        showJunctionPopup(junction)
      })

      markers.push(marker)
    })

    // Store markers on the map object for later cleanup
    map.set("markers", markers)
  }

  // Show junction popup
  const showJunctionPopup = (junction: Junction) => {
    if (!map || !infoWindow || !window.google) return

    // Find the marker for this junction
    const markers = map.get("markers") || []
    const marker = markers.find(
      (m: google.maps.Marker) =>
        m &&
        m.getPosition() &&
        m.getPosition()?.lat() === junction.latitude &&
        m.getPosition()?.lng() === junction.longitude,
    )

    if (!marker) return

    // Create a div to render our React component into
    const popupDiv = document.createElement("div")
    popupDiv.id = `popup-${junction.id}`
    popupDiv.className = "junction-popup-container"

    // Set the content of the info window to this div
    infoWindow.setContent(popupDiv)

    // Open the info window at the marker
    infoWindow.open(map, marker)

    // Set the selected junction to trigger rendering of the popup content
    setSelectedJunction(junction)

    // Add event listener for when the info window is closed
    window.google.maps.event.addListenerOnce(infoWindow, "closeclick", () => {
      setSelectedJunction(null)
    })
  }

  // Update info window content when selected junction changes
  useEffect(() => {
    if (!selectedJunction || !infoWindow) return

    const popupDiv = document.getElementById(`popup-${selectedJunction.id}`)
    if (!popupDiv) return

    // Clear existing content first
    while (popupDiv.firstChild) {
      popupDiv.removeChild(popupDiv.firstChild)
    }

    // Create a root element for React to render into
    const root = document.createElement("div")
    root.className = "junction-popup-container"
    popupDiv.appendChild(root)

    // Create a custom element to render the popup content
    const popupElement = document.createElement("div")
    popupElement.innerHTML = renderJunctionPopup(selectedJunction)
    root.appendChild(popupElement)

    // Add event listener to the view details button
    const viewDetailsBtn = document.getElementById(`view-details-btn-${selectedJunction.id}`)
    if (viewDetailsBtn) {
      // Remove any existing event listeners first
      const newBtn = viewDetailsBtn.cloneNode(true)
      if (viewDetailsBtn.parentNode) {
        viewDetailsBtn.parentNode.replaceChild(newBtn, viewDetailsBtn)
      }

      // Add new event listener
      newBtn.addEventListener("click", () => {
        window.location.href = `/simulate/${selectedJunction.id}`
      })
    }
  }, [selectedJunction, infoWindow])

  // Get a random traffic reason based on traffic level
  const getTrafficReason = (trafficLevel: string) => {
    const level = trafficLevel.toLowerCase() as keyof typeof trafficReasons
    const reasons = trafficReasons[level] || trafficReasons.low
    // Use the junction ID as a seed to get a consistent reason for the same junction
    const index = selectedJunction ? Number.parseInt(selectedJunction.id.replace(/\D/g, "")) % reasons.length : 0
    return reasons[index]
  }

  // Render junction popup content
  const renderJunctionPopup = (junction: Junction) => {
    const trafficLevel = junction.trafficLevel.toLowerCase()
    const isHeavyTraffic = trafficLevel === "high"
    const trafficReason = getTrafficReason(trafficLevel)

    return `
      <div class="p-2 max-w-[300px]">
        <div class="font-bold text-lg">${junction.name}</div>
        <div class="text-sm mb-2">Junction ID: ${junction.id}</div>
        
        <div class="mb-3">
          <span class="text-sm font-medium ${getTrafficLevelTextClass(junction.trafficLevel)}">
            Traffic Level: ${junction.trafficLevel.charAt(0).toUpperCase() + junction.trafficLevel.slice(1)}
          </span>
        </div>
        
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="bg-muted/50 p-2 rounded-md">
            <p class="text-xs text-muted-foreground">Current Traffic</p>
            <p class="font-bold">${junction.currentTrafficCount} vehicles</p>
          </div>
          <div class="bg-muted/50 p-2 rounded-md">
            <p class="text-xs text-muted-foreground">Capacity</p>
            <p class="font-bold">${junction.capacity} vehicles</p>
          </div>
        </div>
        
        <div class="w-full bg-secondary rounded-full h-2.5 mb-3">
          <div class="${getTrafficLevelClass(junction.trafficLevel)} h-2.5 rounded-full" 
               style="width: ${(junction.currentTrafficCount / junction.capacity) * 100}%">
          </div>
          <p class="text-xs text-right mt-1">
            ${Math.round((junction.currentTrafficCount / junction.capacity) * 100)}% of capacity
          </p>
        </div>
        
        <div class="bg-muted/50 p-3 rounded-md mb-3">
          <p class="text-xs text-muted-foreground mb-1">Traffic Status</p>
          <p class="text-sm">
            <span class="font-medium">${isHeavyTraffic ? "⚠️ Heavy traffic detected" : "✓ Normal traffic flow"}</span>
          </p>
          <p class="text-xs mt-1">Reason: ${trafficReason}</p>
        </div>
        
        <button id="view-details-btn-${junction.id}" 
                class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-1.5 px-3 rounded-md text-sm">
          View Details
        </button>
      </div>
    `
  }

  const getMarkerIconByTrafficLevel = (level: string) => {
    // Return a standard marker regardless of traffic level
    return undefined // Using undefined will use the default Google Maps marker
  }

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

  const getTrafficLevelTextClass = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "text-red-500 font-medium"
      case "medium":
        return "text-yellow-500 font-medium"
      case "low":
        return "text-green-500 font-medium"
      default:
        return "text-blue-500 font-medium"
    }
  }

  return (
    <div className="relative h-[calc(100vh-64px)]">
      {/* Search bar */}
      <div className="absolute top-4 left-0 right-0 z-10 mx-auto w-full max-w-md px-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pr-10 bg-background/90 backdrop-blur-sm"
              disabled={!!mapError}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          <Button onClick={handleSearch} disabled={loading || !!mapError}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Map Error Alert */}
      {mapError && (
        <div className="absolute top-20 left-0 right-0 z-10 mx-auto w-full max-w-md px-4">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Map Loading Issue</AlertTitle>
            <AlertDescription>{mapError} Please check your API configuration.</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Help Tip */}
      <div className="absolute bottom-4 right-4 z-10">
        <Alert variant="default" className="bg-background/80 backdrop-blur-sm max-w-xs">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Try searching for cities like "London", "New York", or "Tokyo" to see traffic junctions.
          </AlertDescription>
        </Alert>
      </div>

      {/* Map */}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
