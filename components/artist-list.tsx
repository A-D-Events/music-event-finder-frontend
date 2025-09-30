"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"
import { apiClient, type Artist } from "@/lib/api"

export function ArtistList() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true)
        const health = await apiClient.checkHealth()
        setIsBackendConnected(health.status === "connected")

        console.log("[v0] Artist List - Backend status:", health.status)
        const data = await apiClient.getAllArtists()
        console.log("[v0] Artist List - Loaded artists:", data.length)
        setArtists(data)
        setFilteredArtists(data)
      } catch (error) {
        console.error("[v0] Artist List - Failed to load artists:", error)
        setIsBackendConnected(false)
        const mockData = await apiClient.getAllArtists()
        setArtists(mockData)
        setFilteredArtists(mockData)
      } finally {
        setLoading(false)
      }
    }

    loadArtists()
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredArtists(artists)
      return
    }

    try {
      setSearchLoading(true)
      const searchResults = await apiClient.searchArtists(query)
      setFilteredArtists(searchResults)
    } catch (error) {
      // Fallback to client-side filtering
      const filtered = artists.filter(
        (artist) =>
          artist.name.toLowerCase().includes(query.toLowerCase()) ||
          artist.genres.toLowerCase().includes(query.toLowerCase()),
      )
      setFilteredArtists(filtered)
    } finally {
      setSearchLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading artists...</span>
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
              placeholder="Search artists by name or genre..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtists.map((artist, index) => (
          <Card key={artist.id} className="glow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={artist.image_url || "/placeholder.svg"} alt={artist.name} />
                  <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{artist.name}</h3>
                  <p className="text-sm text-muted-foreground">{artist.followers.toLocaleString()} followers</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Popularity: {artist.popularity}
                    </Badge>
                  </div>
                  {artist.genres && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {artist.genres
                        .split(",")
                        .slice(0, 2)
                        .map((genre, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {genre.trim()}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArtists.length === 0 && !searchLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No artists found matching your search." : "No artists available."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredArtists.length} of {artists.length} artists
            {!isBackendConnected && (
              <span className="block text-xs text-orange-500 mt-1">Using mock data - Backend not connected</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
