"use client"

import { useState, useMemo } from "react"
import { DeviceCard } from "@/components/device-card"
import { DeviceFilters } from "@/components/device-filters"
import { mockDevices } from "@/lib/mock-data"

export function DeviceGrid() {
  const [selectedDevice, setSelectedDevice] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [timeFrom, setTimeFrom] = useState<string>("")
  const [timeTo, setTimeTo] = useState<string>("")

  const filteredDevices = useMemo(() => {
    let filtered = mockDevices

    // Filter by device
    if (selectedDevice !== "all") {
      filtered = filtered.filter((device) => device.device === selectedDevice)
    }

    // Filter by date and time range
    if (dateFrom || timeFrom) {
      const filterFromDate = dateFrom ? new Date(dateFrom) : new Date('1900-01-01')
      const filterFromTime = timeFrom ? timeFrom : '00:00'
      
      // Combine date and time for filtering
      const [hours, minutes] = filterFromTime.split(':').map(Number)
      filterFromDate.setHours(hours, minutes, 0, 0)
      
      filtered = filtered.filter((device) => {
        const deviceDate = new Date(device.timestamp)
        return deviceDate >= filterFromDate
      })
    }
    
    if (dateTo || timeTo) {
      const filterToDate = dateTo ? new Date(dateTo) : new Date('2100-12-31')
      const filterToTime = timeTo ? timeTo : '23:59'
      
      // Combine date and time for filtering
      const [hours, minutes] = filterToTime.split(':').map(Number)
      filterToDate.setHours(hours, minutes, 59, 999)
      
      filtered = filtered.filter((device) => {
        const deviceDate = new Date(device.timestamp)
        return deviceDate <= filterToDate
      })
    }

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
        devices={mockDevices}
      />

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {filteredDevices.map((device) => (
          <DeviceCard key={`${device.device}-${device.timestamp}`} device={device} />
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-card">
          <p className="text-muted-foreground">No devices found matching the filters</p>
        </div>
      )}
    </div>
  )
}
