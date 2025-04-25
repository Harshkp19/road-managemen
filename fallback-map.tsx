import { Map } from "lucide-react"

export function FallbackMap() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted/30 p-4">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center mb-4">
          <Map className="h-8 w-8 mr-2 text-primary" />
          <h2 className="text-xl font-bold">Road Management Map</h2>
        </div>
        <p className="mb-4">The interactive map is currently unavailable. Please check your API configuration.</p>
        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium mb-1">Troubleshooting:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verify your Google Maps API key is correct</li>
            <li>Ensure the Maps JavaScript API is enabled in your Google Cloud Console</li>
            <li>Check for any domain restrictions on your API key</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
