"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Device, SensorReading, DeviceName } from "@/lib/types"

interface DeviceCardProps {
  device: Device
  deviceName?: DeviceName
}

export function DeviceCard({ device, deviceName }: DeviceCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Show the latest reading in collapsed state
  const latestReading = device.readings.length > 0 
    ? device.readings[device.readings.length - 1] 
    : null
  
  if (!latestReading) return null

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = date.toLocaleString("en-US", { month: "short" })
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
    const hours12 = date.getHours() % 12 || 12
    
    return `${month} ${day}, ${year} at ${hours12}:${minutes}:${seconds} ${ampm}`
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
      <Card className="border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 overflow-hidden shadow-lg hover:shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-6 p-6">
          {/* Device Name/MAC Address */}
          <div className="flex items-center gap-4 min-w-[240px]">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex-shrink-0 shadow-sm" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate cursor-help">
                    <div className="font-medium text-base text-gray-900 tracking-tight">
                      {deviceName ? `${deviceName.homeName} - ${deviceName.roomName}` : device.macAddress}
                    </div>
                    {deviceName && (
                      <div className="font-mono text-xs text-gray-500 mt-1">
                        {device.macAddress}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-0 shadow-xl">
                  <p className="font-mono text-sm">MAC Address: {device.macAddress}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Main sensor info - latest reading */}
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">Temperature</span>
              <span className="font-mono text-lg font-semibold text-gray-900">
                {latestReading.temp.toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">Humidity</span>
              <span className="font-mono text-lg font-semibold text-gray-900">
                {latestReading.humid.toFixed(1)}%
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">Updated</span>
              <span className="font-mono text-sm text-gray-600">
                {formatTimestamp(latestReading.timestamp)}
              </span>
            </div>
            <Badge variant="secondary" className="hidden md:inline-flex bg-blue-50 text-blue-700 border-blue-200 font-medium">
              {device.readings.length} reading{device.readings.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Expand button */}
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex-shrink-0 h-10 px-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-none"
            >
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Details
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="border-t border-gray-200/60 bg-gradient-to-br from-gray-50/50 to-white/50 p-6 space-y-6">
            {/* All readings */}
            {device.readings.map((reading, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                    Reading #{index + 1}
                  </Badge>
                  <span className="font-mono text-sm text-gray-600">
                    {formatTimestamp(reading.timestamp)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Temperature</span>
                    <span className="font-mono text-lg font-semibold text-gray-900">
                      {reading.temp.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Humidity</span>
                    <span className="font-mono text-lg font-semibold text-gray-900">
                      {reading.humid.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getSensorData(reading).map((sensor) => (
                    <div
                      key={sensor.key}
                      className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/40 hover:bg-white/80"
                    >
                      <span className="text-xs font-medium text-gray-600">{sensor.label}</span>
                      <span
                        className={`font-mono text-sm font-semibold ${
                          sensor.highlight ? "text-emerald-600" : "text-gray-900"
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
