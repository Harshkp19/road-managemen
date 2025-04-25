import { Header } from "@/components/header"
import { MapContainer } from "@/components/map-container"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <MapContainer />
    </main>
  )
}
