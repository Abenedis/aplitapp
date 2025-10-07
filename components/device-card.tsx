"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { DeviceData } from "@/lib/types"

interface DeviceCardProps {
  device: DeviceData
}

export function DeviceCard({ device }: DeviceCardProps) {
  const [isOpen, setIsOpen] = useState(false)

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

  const additionalSensorData = [
    { label: "AC Current", value: device.ac_current.toString(), key: "ac_current" },
    { label: "Optical Sensor", value: device.opt_sensor.toString(), key: "opt_sensor" },
    { label: "Magnetometer (HULL)", value: device.hull.toString(), key: "hull" },
    {
      label: "PIR Sensor",
      value: device.pir === 1 ? "Active" : "Inactive",
      key: "pir",
      highlight: device.pir === 1,
    },
    { label: "GPIO7 (IN2)", value: device.in2.toString(), key: "in2" },
    { label: "Distance", value: `${device.dist} cm`, key: "dist" },
  ]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 p-4">
          {/* Device MAC Address */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
            <code className="font-mono text-sm font-medium text-foreground truncate">
              {device.device}
            </code>
          </div>

          {/* Main sensor info */}
          <div className="flex items-center gap-6 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Temp:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {device.temp.toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Humidity:</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {device.humid.toFixed(1)}%
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Updated:</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatTimestamp(device.timestamp)}
              </span>
            </div>
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
          <div className="border-t border-border bg-secondary/30 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {additionalSensorData.map((sensor) => (
                <div
                  key={sensor.key}
                  className="flex items-center justify-between bg-card rounded-md p-3 border border-border/50"
                >
                  <span className="text-sm text-muted-foreground">{sensor.label}</span>
                  <span
                    className={`font-mono text-sm font-medium ${
                      sensor.highlight ? "text-success" : "text-foreground"
                    }`}
                  >
                    {sensor.value}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Mobile timestamp */}
            <div className="lg:hidden mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Updated</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTimestamp(device.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
