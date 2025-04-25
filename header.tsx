"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { BarChart3, LayoutDashboard, Map, Menu, ShieldAlert, SlidersHorizontal, Zap } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Map",
    icon: Map,
    href: "/",
    color: "text-emerald-500",
  },
  {
    label: "Analysis",
    icon: BarChart3,
    href: "/analysis",
    color: "text-violet-500",
  },
  {
    label: "Simulation",
    icon: SlidersHorizontal,
    href: "/traffic-simulation",
    color: "text-pink-700",
  },
  {
    label: "AI Optimization",
    icon: Zap,
    href: "/ai-simulation",
    color: "text-orange-700",
  },
  {
    label: "Safety",
    icon: ShieldAlert,
    href: "/safety",
    color: "text-red-500",
  },
]

export function Header() {
  const pathname = usePathname()

  return (
    <div className="flex items-center p-4 border-b h-16">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <nav className="flex flex-col gap-4 mt-8">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-lg transition-colors rounded-md hover:bg-accent",
                  pathname === route.href ? "bg-accent" : "transparent",
                )}
              >
                <route.icon className={cn("h-5 w-5", route.color)} />
                {route.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="hidden md:flex items-center gap-x-4">
        <Link href="/" className="flex items-center">
          <h1 className="text-xl font-bold">Road Management</h1>
        </Link>
        <nav className="flex items-center gap-4 mx-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md hover:bg-accent",
                pathname === route.href ? "bg-accent" : "transparent",
              )}
            >
              <route.icon className={cn("h-4 w-4", route.color)} />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="ml-auto flex items-center gap-x-2">
        <ModeToggle />
      </div>
    </div>
  )
}
