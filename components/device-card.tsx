"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, ChevronUp, EyeOff, Trash2 } from "lucide-react"
import type { Device, SensorReading, DeviceName } from "@/lib/types"

interface DeviceCardProps {
  device: Device
  deviceName?: DeviceName
  onHide?: (macAddress: string) => void
  onDelete?: (macAddress: string) => void
  showActions?: boolean
}

export function DeviceCard({ device, deviceName, onHide, onDelete, showActions = true }: DeviceCardProps) {
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
    { label: "Temperature", value: `${reading.temp.toFixed(1)}°C`, key: "temp" },
    { label: "Humidity", value: `${reading.humid.toFixed(1)}%`, key: "humid" },
    { label: "AC Current", value: `${reading.ac_current.toFixed(3)} A`, key: "ac_current" },
    { label: "Optical Sensor", value: reading.opt_sensor.toFixed(2), key: "opt_sensor" },
    { label: "Magnetometer (HULL)", value: reading.hull.toFixed(3), key: "hull" },
    {
      label: "PIR Sensor",
      value: reading.pir === 1 ? "Active" : "Inactive",
      key: "pir",
      highlight: reading.pir === 1,
    },
    { label: "GPIO7 (IN2)", value: reading.in2.toString(), key: "in2" },
    { label: "Distance", value: `${reading.dist.toFixed(1)} cm`, key: "dist" },
  ]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 overflow-hidden shadow-lg hover:shadow-xl backdrop-blur-sm">
        <div className="p-4 sm:p-6">
          {/* Top row - Device name and sensor data */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            {/* Device Name/MAC Address */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 sm:max-w-[300px]">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex-shrink-0 shadow-sm" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate cursor-help">
                      <div className="font-medium text-sm sm:text-base text-gray-900 tracking-tight">
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
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">Temp</span>
                <span className="font-mono text-sm sm:text-lg font-semibold text-gray-900">
                  {latestReading.temp.toFixed(1)}°C
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">Humidity</span>
                <span className="font-mono text-sm sm:text-lg font-semibold text-gray-900">
                  {latestReading.humid.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">AC Current</span>
                <span className="font-mono text-sm sm:text-lg font-semibold text-gray-900">
                  {latestReading.ac_current.toFixed(2)}A
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">Distance</span>
                <span className="font-mono text-sm sm:text-lg font-semibold text-gray-900">
                  {latestReading.dist.toFixed(0)}cm
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                <span className="text-sm text-gray-500 font-medium">Updated</span>
                <span className="font-mono text-sm text-gray-600">
                  {formatTimestamp(latestReading.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom row - Badge, Actions and Button */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="hidden sm:inline-flex bg-blue-50 text-blue-700 border-blue-200 font-medium">
              {device.readings.length} reading{device.readings.length !== 1 ? 's' : ''}
            </Badge>

            <div className="flex items-center gap-2">
              {/* Action buttons */}
              {showActions && onHide && onDelete && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onHide(device.macAddress)}
                    className="h-8 px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                    title="Hide device"
                  >
                    <EyeOff className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(device.macAddress)}
                    className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                    title="Delete device"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Expand button - always visible */}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-none w-full sm:w-auto"
                >
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Collapse</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Details</span>
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
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
                
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {getSensorData(reading).map((sensor) => (
                        <div
                          key={sensor.key}
                          className="flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/40 hover:bg-white/80"
                        >
                          <span className="text-xs font-medium text-gray-600 mb-2 text-center">{sensor.label}</span>
                          <span
                            className={`font-mono text-lg font-semibold text-center ${
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
