const API_BASE_URL = "http://localhost:8080"

export interface Artist {
  id: string
  name: string
  popularity: number
  followers: number
  genres: string
  image_url: string
}

export interface Event {
  id: string
  name: string
  date: string
  venue: string
  city: string
  url: string
  image: string
}

export interface Stats {
  artists: number
  events: number
}

// Utilidad simple para normalizar URLs de eventos (se puede mover a utils.ts si prefieres)
export function normalizeExternalUrl(raw?: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  // Evitar esquemas peligrosos
  if (/^(javascript:|data:)/i.test(trimmed)) return null
  return `https://${trimmed}`
}

// Mock data as fallback
const mockArtists: Artist[] = [
  {
    id: "1",
    name: "Arctic Monkeys",
    popularity: 85,
    followers: 12000000,
    genres: "indie rock, alternative rock",
    image_url: "/arctic-monkeys.jpg",
  },
  {
    id: "2",
    name: "Tame Impala",
    popularity: 82,
    followers: 8500000,
    genres: "psychedelic rock, indie pop",
    image_url: "/tame-impala.jpg",
  },
  {
    id: "3",
    name: "The Strokes",
    popularity: 78,
    followers: 6200000,
    genres: "indie rock, garage rock",
    image_url: "/the-strokes.jpg",
  },
  {
    id: "4",
    name: "Mac DeMarco",
    popularity: 75,
    followers: 4100000,
    genres: "indie pop, lo-fi",
    image_url: "/mac-demarco.jpg",
  },
]

const mockEvents: Event[] = [
  {
    id: "1",
    name: "Arctic Monkeys World Tour",
    date: "2024-03-15T20:00:00Z",
    venue: "Madison Square Garden",
    city: "New York, NY",
    url: "https://example.com/tickets/1",
    image: "/arctic-monkeys-concert.jpg",
  },
  {
    id: "2",
    name: "Tame Impala: Currents Tour",
    date: "2024-03-22T19:30:00Z",
    venue: "The Forum",
    city: "Los Angeles, CA",
    url: "https://example.com/tickets/2",
    image: "/tame-impala-concert.jpg",
  },
]

class ApiClient {
  private async fetchJson<T>(endpoint: string): Promise<T> {
    try {
      console.log("[v0] Making API call to:", `${API_BASE_URL}${endpoint}`)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors", // Explicitly enable CORS
        credentials: "omit", // Don't send credentials for CORS
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      console.log("[v0] API response status:", response.status, response.statusText)
      console.log("[v0] API response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] API response data:", data)
      return data
    } catch (error) {
      console.log("[v0] API call failed:", error)
      throw error
    }
  }

  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      console.log("[v0] Checking backend health...")
      const response = await this.fetchJson<{ status: string; message: string }>("/health")
      console.log("[v0] Health check successful:", response)
      return {
        status: "connected",
        message: response.message || "Backend is healthy",
      }
    } catch (error) {
      console.log("[v0] Health check failed:", error)
      return {
        status: "disconnected",
        message: "Java backend not accessible",
      }
    }
  }

  async getStats(): Promise<Stats> {
    try {
      return await this.fetchJson("/stats")
    } catch (error) {
      return { artists: mockArtists.length, events: mockEvents.length }
    }
  }

  async getTopArtists(limit = 20): Promise<Artist[]> {
    try {
      return await this.fetchJson(`/artists/top?limit=${limit}`)
    } catch (error) {
      return mockArtists.slice(0, limit)
    }
  }

  async getTopEvents(limit = 20): Promise<Event[]> {
    try {
      return await this.fetchJson(`/events/top?limit=${limit}`)
    } catch (error) {
      return mockEvents.slice(0, limit)
    }
  }

  async getArtist(id: string): Promise<Artist> {
    try {
      return await this.fetchJson(`/artists/${id}`)
    } catch (error) {
      const artist = mockArtists.find((a) => a.id === id)
      if (!artist) throw new Error("Artist not found")
      return artist
    }
  }

  async getEvent(id: string): Promise<Event> {
    try {
      return await this.fetchJson(`/events/${id}`)
    } catch (error) {
      const event = mockEvents.find((e) => e.id === id)
      if (!event) throw new Error("Event not found")
      return event
    }
  }

  async searchArtists(query: string): Promise<Artist[]> {
    try {
      return await this.fetchJson(`/artists/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      return mockArtists
        .filter(
          (artist) =>
            artist.name.toLowerCase().includes(query.toLowerCase()) ||
            artist.genres.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0)
    }
  }

  async searchEvents(query: string): Promise<Event[]> {
    try {
      return await this.fetchJson(`/events/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      return mockEvents
        .filter(
          (event) =>
            event.name.toLowerCase().includes(query.toLowerCase()) ||
            event.venue.toLowerCase().includes(query.toLowerCase()) ||
            event.city.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0)
    }
  }

  async getAllArtists(): Promise<Artist[]> {
    try {
      // Intentar escalar el límite si el backend realmente lo respeta
      const limits = [50, 100, 250, 500]
      let last: Artist[] = []
      for (const limit of limits) {
        const data = await this.fetchJson<Artist[]>(`/artists/top?limit=${limit}`)
        last = data
        // Si devuelve menos que el límite solicitado, asumimos que ya no hay más
        if (!Array.isArray(data) || data.length < limit) break
      }
      return last
    } catch (error) {
      return mockArtists
    }
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      // 1. Primer intento: pedir lo máximo posible directamente (esperando que algún día el backend levante el límite)
      const directLimits = [500, 400, 300, 250, 200]
      let base: Event[] = []
      for (const limit of directLimits) {
        try {
          const data = await this.fetchJson<Event[]>(`/events/top?limit=${limit}`)
          base = data
          if (data.length < limit) return data // ya es todo lo disponible
          // Si el backend devuelve exactamente el límite (probablemente truncado), intentamos paginar
          break
        } catch (e) {
          // probar siguiente límite menor
          continue
        }
      }

      // Si no obtuvimos nada en primer intento, fallback a mock
      if (base.length === 0) return mockEvents

      // 2. Intento de paginación incremental si el backend soporta offset/page
      // Asumimos que el backend puede aceptar offset ó page (común en APIs sencillas)
      const pageSize = Math.min(base.length, 200) || 200 // usar el tamaño que nos dio como referencia
      const maxTotal = 1000 // límite superior configurable
      const collectedMap = new Map(base.map((e) => [e.id, e]))

      // Helper para fusionar
      const merge = (arr: Event[]) => {
        for (const ev of arr) {
          if (!collectedMap.has(ev.id)) collectedMap.set(ev.id, ev)
        }
      }

      // Si ya tenemos >= maxTotal, devolvemos
      if (collectedMap.size >= maxTotal) return Array.from(collectedMap.values())

      // Estrategias de paginación a probar secuencialmente
      type Strategy = {
        name: string
        buildUrl: (index: number) => string
      }
      const strategies: Strategy[] = [
        {
          name: "offset",
          buildUrl: (i) => `/events/top?limit=${pageSize}&offset=${i * pageSize}`,
        },
        {
          name: "page0",
          buildUrl: (i) => `/events/top?limit=${pageSize}&page=${i}`,
        },
        {
          name: "page1",
          buildUrl: (i) => `/events/top?limit=${pageSize}&page=${i + 1}`,
        },
      ]

      let strategyUsed: string | null = null

      for (const strat of strategies) {
        let success = false
        for (let i = 1; i < 10; i++) { // hasta 10 páginas adicionales
          const url = strat.buildUrl(i)
          try {
            const chunk = await this.fetchJson<Event[]>(url)
            // Si no devuelve nada, fin de esta estrategia
            if (!chunk || chunk.length === 0) break
            // Si todos ya estaban, probablemente la estrategia no funciona (rompemos)
            const before = collectedMap.size
            merge(chunk)
            const after = collectedMap.size
            if (after === before) {
              // No crecimos: la API repite la primera página -> abandonar estrategia
              break
            }
            success = true
            if (chunk.length < pageSize) {
              // Última página real
              break
            }
            if (collectedMap.size >= maxTotal) break
          } catch (e) {
            break // error en esta página -> abandonar estrategia
          }
        }
        if (success) {
          strategyUsed = strat.name
          break
        }
      }

      const result = Array.from(collectedMap.values())
      console.log(`[v0] getAllEvents -> total=${result.length} strategy=${strategyUsed || 'single-request'}`)
      return result
    } catch (error) {
      return mockEvents
    }
  }
}

export const apiClient = new ApiClient()
