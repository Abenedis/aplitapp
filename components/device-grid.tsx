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

    console.log('Filtering with:', { selectedDevice, dateFrom, timeFrom, dateTo, timeTo })

    // Filter by device
    if (selectedDevice !== "all") {
      filtered = filtered.filter((device) => device.device === selectedDevice)
      console.log('After device filter:', filtered.length)
    }

    // Filter by date and time range
    if (dateFrom || timeFrom) {
      filtered = filtered.filter((device) => {
        const deviceDate = new Date(device.timestamp)
        
        // If we have both date and time, combine them
        if (dateFrom && timeFrom) {
          const [hours, minutes] = timeFrom.split(':').map(Number)
          const filterFromDate = new Date(dateFrom)
          filterFromDate.setHours(hours, minutes, 0, 0)
          return deviceDate >= filterFromDate
        }
        
        // If we only have date, compare dates (ignore time)
        if (dateFrom && !timeFrom) {
          const filterFromDate = new Date(dateFrom)
          filterFromDate.setHours(0, 0, 0, 0)
          const deviceDateOnly = new Date(deviceDate)
          deviceDateOnly.setHours(0, 0, 0, 0)
          return deviceDateOnly >= filterFromDate
        }
        
        // If we only have time, compare times (ignore date)
        if (!dateFrom && timeFrom) {
          const [hours, minutes] = timeFrom.split(':').map(Number)
          const deviceTime = deviceDate.getHours() * 60 + deviceDate.getMinutes()
          const filterTime = hours * 60 + minutes
          return deviceTime >= filterTime
        }
        
        return true
      })
    }
    
    if (dateTo || timeTo) {
      filtered = filtered.filter((device) => {
        const deviceDate = new Date(device.timestamp)
        
        // If we have both date and time, combine them
        if (dateTo && timeTo) {
          const [hours, minutes] = timeTo.split(':').map(Number)
          const filterToDate = new Date(dateTo)
          filterToDate.setHours(hours, minutes, 59, 999)
          return deviceDate <= filterToDate
        }
        
        // If we only have date, compare dates (ignore time)
        if (dateTo && !timeTo) {
          const filterToDate = new Date(dateTo)
          filterToDate.setHours(23, 59, 59, 999)
          return deviceDate <= filterToDate
        }
        
        // If we only have time, compare times (ignore date)
        if (!dateTo && timeTo) {
          const [hours, minutes] = timeTo.split(':').map(Number)
          const deviceTime = deviceDate.getHours() * 60 + deviceDate.getMinutes()
          const filterTime = hours * 60 + minutes
          return deviceTime <= filterTime
        }
        
        return true
      })
      console.log('After date/time filter:', filtered.length)
    }

    console.log('Final filtered devices:', filtered.length)
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
