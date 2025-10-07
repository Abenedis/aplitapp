"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Device, SensorReading } from "@/lib/types"

interface DeviceCardProps {
  device: Device
}

export function DeviceCard({ device }: DeviceCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Show the latest reading in collapsed state
  const latestReading = device.readings.length > 0 
    ? device.readings[device.readings.length - 1] 
    : null
  
  if (!latestReading) return null

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getSensorData = (reading: SensorReading) => [
    { label: "AC Current", value: reading.ac_current.toString(), key: "ac_current" },
    { label: "Optical Sensor", value: reading.opt_sensor.toString(), key: "opt_sensor" },
    { label: "Magnetometer (HULL)", value: reading.hull.toString(), key: "hull" },
    {
      label: "PIR Sensor",
      value: reading.pir === 1 ? "Active" : "Inactive",
      key: "pir",
      highlight: reading.pir === 1,
    },
    { label: "GPIO7 (IN2)", value: reading.in2.toString(), key: "in2" },
    { label: "Distance", value: `${reading.dist} cm`, key: "dist" },
  ]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 p-4">
          {/* Device MAC Address */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
            <code className="font-mono text-sm font-medium text-foreground truncate">
              {device.macAddress}
            </code>
          </div>

          {/* Main sensor info - latest reading */}
          <div className="flex items-center gap-6 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Temp:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {latestReading.temp.toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Humidity:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {latestReading.humid.toFixed(1)}%
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Updated:</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatTimestamp(latestReading.timestamp)}
              </span>
            </div>
            <Badge variant="secondary" className="hidden md:inline-flex">
              {device.readings.length} reading{device.readings.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Expand button */}
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex-shrink-0 hover:bg-secondary"
            >
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Details
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border bg-secondary/30 p-4 space-y-4">
            {/* All readings */}
            {device.readings.map((reading, index) => (
              <div key={index} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">
                    Reading #{index + 1}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTimestamp(reading.timestamp)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Temperature</span>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {reading.temp.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Humidity</span>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {reading.humid.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getSensorData(reading).map((sensor) => (
                    <div
                      key={sensor.key}
                      className="flex items-center justify-between bg-secondary/50 rounded-md p-2"
                    >
                      <span className="text-xs text-muted-foreground">{sensor.label}</span>
                      <span
                        className={`font-mono text-xs font-medium ${
                          sensor.highlight ? "text-success" : "text-foreground"
                        }`}
                      >
                        {sensor.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
