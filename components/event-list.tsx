"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, MapPin, Calendar, ExternalLink } from "lucide-react"
import { apiClient, type Event } from "@/lib/api"

export function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const health = await apiClient.checkHealth()
        setIsBackendConnected(health.status === "connected")

        console.log("[v0] Event List - Backend status:", health.status)
        const data = await apiClient.getAllEvents()
        console.log("[v0] Event List - Loaded events:", data.length)
        setEvents(data)
        setFilteredEvents(data)
      } catch (error) {
        console.error("[v0] Event List - Failed to load events:", error)
        setIsBackendConnected(false)
        const mockData = await apiClient.getAllEvents()
        setEvents(mockData)
        setFilteredEvents(mockData)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredEvents(events)
      return
    }

    try {
      setSearchLoading(true)
      const searchResults = await apiClient.searchEvents(query)
      setFilteredEvents(searchResults)
    } catch (error) {
      // Fallback to client-side filtering
      const filtered = events.filter(
        (event) =>
          event.name.toLowerCase().includes(query.toLowerCase()) ||
          event.venue.toLowerCase().includes(query.toLowerCase()) ||
          event.city.toLowerCase().includes(query.toLowerCase()),
      )
      setFilteredEvents(filtered)
    } finally {
      setSearchLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading events...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
            )}
            <Input
              placeholder="Search events by name, venue, or city..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="glow-card overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={event.image || "/placeholder.svg?height=200&width=400&query=concert"}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">Event</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{event.name}</CardTitle>
              <CardDescription className="text-primary font-medium">Live Event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {event.venue}, {event.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">Event Details</span>
                <Button asChild size="sm" className="flex items-center gap-2">
                  <a
                    href={(() => {
                      if (!event.url) return "#"
                      const trimmed = event.url.trim()
                      if (!trimmed) return "#"
                      return trimmed.startsWith("http://") || trimmed.startsWith("https://")
                        ? trimmed
                        : `https://${trimmed}`
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Event
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && !searchLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No events found matching your search." : "No events available."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredEvents.length} of {events.length} events
            {!isBackendConnected && (
              <span className="block text-xs text-orange-500 mt-1">Using mock data - Backend not connected</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
