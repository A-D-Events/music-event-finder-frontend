"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Music,
  Calendar,
  MapPin,
  Play,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  List,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiClient, type Artist, type Event, type Stats } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConnectionTest } from "@/components/connection-test"
import { ArtistList } from "@/components/artist-list"
import { EventList } from "@/components/event-list"

export default function MusicEventFinder() {
  const [searchQuery, setSearchQuery] = useState("")
  const [artists, setArtists] = useState<Artist[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking")

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("[v0] Starting to load initial data...")
        setLoading(true)
        setError(null)

        // Check backend health first
        console.log("[v0] Checking backend health...")
        const healthCheck = await apiClient.checkHealth()
        console.log("[v0] Health check result:", healthCheck)

        const isConnected = healthCheck.status === "connected"
        setBackendStatus(isConnected ? "connected" : "disconnected")
        console.log("[v0] Backend status set to:", isConnected ? "connected" : "disconnected")

        // Load data (will use fallback if backend is down)
        console.log("[v0] Loading data from API...")
        const [artistsData, eventsData, statsData] = await Promise.all([
          apiClient.getTopArtists(10),
          apiClient.getTopEvents(20),
          apiClient.getStats(),
        ])

        console.log("[v0] Data loaded:", {
          artists: artistsData.length,
          events: eventsData.length,
          stats: statsData,
        })

        setArtists(artistsData)
        setEvents(eventsData)
        setFilteredEvents(eventsData)
        setStats(statsData)
      } catch (err) {
        console.log("[v0] Error loading initial data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
        console.log("[v0] Initial data loading completed")
      }
    }

    loadInitialData()
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
    } catch (err) {
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

  const getGenreDistribution = (artists: Artist[]) => {
    const genreCount: { [key: string]: number } = {}
    let totalGenres = 0

    artists.forEach((artist) => {
      if (artist.genres) {
        const genres = artist.genres.split(",").map((g) => g.trim())
        genres.forEach((genre) => {
          if (genre) {
            genreCount[genre] = (genreCount[genre] || 0) + 1
            totalGenres++
          }
        })
      }
    })

    return Object.entries(genreCount)
      .map(([genre, count]) => ({
        genre,
        percentage: Math.round((count / totalGenres) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your music data...</p>
        </div>
      </div>
    )
  }

  const genreDistribution = getGenreDistribution(artists)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="music-bars">
                <div className="music-bar"></div>
                <div className="music-bar"></div>
                <div className="music-bar"></div>
                <div className="music-bar"></div>
                <div className="music-bar"></div>
              </div>
              <h1 className="text-2xl font-bold gradient-text">Music Event Finder</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Backend Status Indicator */}
              <Badge
                variant={
                  backendStatus === "connected"
                    ? "default"
                    : backendStatus === "disconnected"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs"
              >
                {backendStatus === "connected" && <CheckCircle className="w-3 h-3 mr-1" />}
                {backendStatus === "disconnected" && <XCircle className="w-3 h-3 mr-1" />}
                {backendStatus === "checking" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {backendStatus === "connected"
                  ? "Backend Connected"
                  : backendStatus === "disconnected"
                    ? "Using Mock Data"
                    : "Checking..."}
              </Badge>
              {stats && (
                <Badge variant="outline" className="text-xs">
                  {stats.artists} Artists • {stats.events} Events
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Backend Status Alert */}
      {backendStatus === "disconnected" && (
        <div className="container mx-auto px-4 pt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Java Backend Not Connected:</strong> The interface is running with mock data.
              <br />
              <strong>To connect your Java backend:</strong>
              <br />
              1. Open your Java project in IntelliJ IDEA
              <br />
              2. Run the Main.java class (should show "API server started on port 8080")
              <br />
              3. Test manually: Open <code>http://localhost:8080/health</code> in your browser
              <br />
              4. If it works, refresh this page - the status should change to "Backend Connected"
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {backendStatus === "disconnected" && <ConnectionTest />}

        <Tabs defaultValue="habits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="habits" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Listening Habits
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recommended Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="space-y-6">
            <Tabs defaultValue="top-artists" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="top-artists" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Top Artists
                </TabsTrigger>
                <TabsTrigger value="all-artists" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  All Artists
                </TabsTrigger>
              </TabsList>

              <TabsContent value="top-artists" className="space-y-6">
                {/* Top Artists */}
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-primary" />
                      Your Top Artists
                    </CardTitle>
                    <CardDescription>
                      {backendStatus === "connected"
                        ? "Based on popularity and follower count"
                        : "Demo data - connect your Java backend for real data"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {artists.slice(0, 8).map((artist, index) => (
                        <div key={artist.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                          <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={artist.image_url || "/placeholder.svg"} alt={artist.name} />
                            <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{artist.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {artist.followers.toLocaleString()} followers • Popularity: {artist.popularity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Genres */}
                {genreDistribution.length > 0 && (
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Genre Distribution</CardTitle>
                      <CardDescription>Based on your top artists</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {genreDistribution.map((genre) => (
                        <div key={genre.genre} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{genre.genre}</span>
                            <span className="text-muted-foreground">{genre.percentage}%</span>
                          </div>
                          <Progress value={genre.percentage} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle>Your Music Profile</CardTitle>
                    <CardDescription>Complete insights from your listening data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <div className="text-2xl font-bold text-primary">{stats?.artists || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Artists</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <div className="text-2xl font-bold text-primary">{genreDistribution.length}</div>
                        <div className="text-sm text-muted-foreground">Genres</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <div className="text-2xl font-bold text-primary">
                          {artists.length > 0
                            ? Math.round(artists.reduce((sum, a) => sum + a.popularity, 0) / artists.length)
                            : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Popularity</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <div className="text-2xl font-bold text-primary">{stats?.events || 0}</div>
                        <div className="text-sm text-muted-foreground">Available Events</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all-artists">
                <ArtistList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Tabs defaultValue="recommended" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="recommended" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Recommended
                </TabsTrigger>
                <TabsTrigger value="all-events" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  All Events
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((event) => (
                    <Card key={event.id} className="glow-card overflow-hidden">
                      <div className="aspect-video relative">
                        <img
                          src={event.image || "/placeholder.svg?height=200&width=400&query=concert"}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                          Recommended
                        </Badge>
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
                          <Button asChild className="flex items-center gap-2">
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
              </TabsContent>

              <TabsContent value="all-events">
                <EventList />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
