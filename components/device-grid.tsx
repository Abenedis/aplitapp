"use client"

import { useState, useMemo } from "react"
import { DeviceCard } from "@/components/device-card"
import { DeviceFilters } from "@/components/device-filters"
import { devices, mockDevices } from "@/lib/mock-data"
import type { Device } from "@/lib/types"

export function DeviceGrid() {
  const [selectedDevice, setSelectedDevice] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [timeFrom, setTimeFrom] = useState<string>("")
  const [timeTo, setTimeTo] = useState<string>("")

  const resetFilters = () => {
    setSelectedDevice("all")
    setDateFrom("")
    setDateTo("")
    setTimeFrom("")
    setTimeTo("")
  }

  const filteredDevices = useMemo(() => {
    // Filter devices and their readings
    let filtered: Device[] = devices

    // Filter by device MAC address
    if (selectedDevice !== "all") {
      filtered = filtered.filter((device) => device.macAddress === selectedDevice)
    }

    // Filter readings within each device by date and time
    filtered = filtered.map((device) => {
      const filteredReadings = device.readings.filter((reading) => {
        const readingDate = new Date(reading.timestamp)
        
        // Check FROM filters
        let passesFrom = true
        if (dateFrom || timeFrom) {
          if (dateFrom && timeFrom) {
            // Both date and time specified
            const filterFromDate = new Date(dateFrom + 'T' + timeFrom + ':00.000')
            passesFrom = readingDate >= filterFromDate
          } else if (dateFrom) {
            // Only date specified
            const filterFromDate = new Date(dateFrom + 'T00:00:00.000')
            passesFrom = readingDate >= filterFromDate
          }
        }
        
        // Check TO filters
        let passesTo = true
        if (dateTo || timeTo) {
          if (dateTo && timeTo) {
            // Both date and time specified
            const filterToDate = new Date(dateTo + 'T' + timeTo + ':59.999')
            passesTo = readingDate <= filterToDate
          } else if (dateTo) {
            // Only date specified
            const filterToDate = new Date(dateTo + 'T23:59:59.999')
            passesTo = readingDate <= filterToDate
          }
        }
        
        return passesFrom && passesTo
      })

      return {
        ...device,
        readings: filteredReadings,
      }
    })

    // Remove devices with no readings after filtering
    filtered = filtered.filter((device) => device.readings.length > 0)

    return filtered
  }, [selectedDevice, dateFrom, dateTo, timeFrom, timeTo])

  return (
    <div className="space-y-6">
      <DeviceFilters
        selectedDevice={selectedDevice}
        onDeviceChange={setSelectedDevice}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        timeFrom={timeFrom}
        onTimeFromChange={setTimeFrom}
        timeTo={timeTo}
        onTimeToChange={setTimeTo}
        onResetFilters={resetFilters}
        devices={mockDevices}
      />

      <div className="flex flex-col gap-3">
        {filteredDevices.map((device) => (
          <DeviceCard key={device.macAddress} device={device} />
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-card">
          <p className="text-muted-foreground">No devices or readings found matching the filters</p>
        </div>
      )}
    </div>
  )
}
