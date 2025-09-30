"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ConnectionTest() {
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult("Testing connection...")

    try {
      console.log("[v0] Testing direct connection to Java backend...")

      // Test 1: Basic fetch to health endpoint
      const response = await fetch("http://localhost:8080/health", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors", // Explicitly set CORS mode
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.text()
        console.log("[v0] Response data:", data)
        setTestResult(`✅ Connection successful! Status: ${response.status}, Response: ${data}`)
      } else {
        setTestResult(`❌ Connection failed with status: ${response.status}`)
      }
    } catch (error) {
      console.log("[v0] Connection test error:", error)
      setTestResult(`❌ Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Backend Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading ? "Testing..." : "Test Connection to localhost:8080"}
        </Button>
        {testResult && (
          <div className="p-3 bg-muted rounded-md">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          <p>This will test the direct connection to your Java backend.</p>
          <p>Make sure your Java application is running on port 8080.</p>
        </div>
      </CardContent>
    </Card>
  )
}
