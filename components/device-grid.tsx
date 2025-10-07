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

  const resetFilters = () => {
    setSelectedDevice("all")
    setDateFrom("")
    setDateTo("")
    setTimeFrom("")
    setTimeTo("")
  }

  const filteredDevices = useMemo(() => {
    let filtered = mockDevices

    console.log('=== FILTERING START ===')
    console.log('Filtering with:', { selectedDevice, dateFrom, timeFrom, dateTo, timeTo })
    console.log('Available devices and their times:')
    mockDevices.forEach(device => {
      const deviceDate = new Date(device.timestamp)
      const localTime = `${deviceDate.getHours()}:${deviceDate.getMinutes().toString().padStart(2, '0')}`
      const ampm = deviceDate.getHours() >= 12 ? 'PM' : 'AM'
      const hours12 = deviceDate.getHours() === 0 ? 12 : deviceDate.getHours() > 12 ? deviceDate.getHours() - 12 : deviceDate.getHours()
      const displayTime = `${hours12}:${deviceDate.getMinutes().toString().padStart(2, '0')} ${ampm}`
      console.log(`- ${device.device}: ${device.timestamp} (Local: ${localTime} / ${displayTime})`)
    })

    // Filter by device
    if (selectedDevice !== "all") {
      filtered = filtered.filter((device) => device.device === selectedDevice)
      console.log('After device filter:', filtered.length)
    }

    // Filter by date and time range
    filtered = filtered.filter((device) => {
      const deviceDate = new Date(device.timestamp)
      const localTime = `${deviceDate.getHours()}:${deviceDate.getMinutes().toString().padStart(2, '0')}`
      const ampm = deviceDate.getHours() >= 12 ? 'PM' : 'AM'
      const hours12 = deviceDate.getHours() === 0 ? 12 : deviceDate.getHours() > 12 ? deviceDate.getHours() - 12 : deviceDate.getHours()
      const displayTime = `${hours12}:${deviceDate.getMinutes().toString().padStart(2, '0')} ${ampm}`
      console.log('Checking device:', device.device, 'timestamp:', device.timestamp, 'deviceDate:', deviceDate, 'Local time:', localTime, 'Display:', displayTime)
      
      // Check FROM filters
      let passesFrom = true
      if (dateFrom || timeFrom) {
        if (dateFrom && timeFrom) {
          // Both date and time specified - create exact datetime in local time
          const filterFromDate = new Date(dateFrom + 'T' + timeFrom + ':00.000')
          const filterTime = `${filterFromDate.getHours()}:${filterFromDate.getMinutes().toString().padStart(2, '0')}`
          const filterAmpm = filterFromDate.getHours() >= 12 ? 'PM' : 'AM'
          const filterHours12 = filterFromDate.getHours() === 0 ? 12 : filterFromDate.getHours() > 12 ? filterFromDate.getHours() - 12 : filterFromDate.getHours()
          const filterDisplayTime = `${filterHours12}:${filterFromDate.getMinutes().toString().padStart(2, '0')} ${filterAmpm}`
          console.log('Filter FROM (date+time):', filterFromDate, `(${filterTime} / ${filterDisplayTime})`, 'Device:', deviceDate, 'Passes:', deviceDate >= filterFromDate)
          passesFrom = deviceDate >= filterFromDate
        } else if (dateFrom) {
          // Only date specified - check if device date is >= filter date (any time)
          const filterFromDate = new Date(dateFrom + 'T00:00:00.000')
          console.log('Filter FROM (date only):', filterFromDate, 'Device:', deviceDate, 'Passes:', deviceDate >= filterFromDate)
          passesFrom = deviceDate >= filterFromDate
        } else if (timeFrom) {
          // Only time specified - ignore this filter (time without date is not meaningful)
          console.log('Filter FROM (time only): Ignored - time filter requires date')
          passesFrom = true
        }
      }
      
      // Check TO filters
      let passesTo = true
      if (dateTo || timeTo) {
        if (dateTo && timeTo) {
          // Both date and time specified - create exact datetime in local time
          const filterToDate = new Date(dateTo + 'T' + timeTo + ':59.999')
          const filterTime = `${filterToDate.getHours()}:${filterToDate.getMinutes().toString().padStart(2, '0')}`
          const filterAmpm = filterToDate.getHours() >= 12 ? 'PM' : 'AM'
          const filterHours12 = filterToDate.getHours() === 0 ? 12 : filterToDate.getHours() > 12 ? filterToDate.getHours() - 12 : filterToDate.getHours()
          const filterDisplayTime = `${filterHours12}:${filterToDate.getMinutes().toString().padStart(2, '0')} ${filterAmpm}`
          console.log('Filter TO (date+time):', filterToDate, `(${filterTime} / ${filterDisplayTime})`, 'Device:', deviceDate, 'Passes:', deviceDate <= filterToDate)
          passesTo = deviceDate <= filterToDate
        } else if (dateTo) {
          // Only date specified - check if device date is <= filter date (any time)
          const filterToDate = new Date(dateTo + 'T23:59:59.999')
          console.log('Filter TO (date only):', filterToDate, 'Device:', deviceDate, 'Passes:', deviceDate <= filterToDate)
          passesTo = deviceDate <= filterToDate
        } else if (timeTo) {
          // Only time specified - ignore this filter (time without date is not meaningful)
          console.log('Filter TO (time only): Ignored - time filter requires date')
          passesTo = true
        }
      }
      
      const passes = passesFrom && passesTo
      console.log('Final result for device', device.device, ':', passes)
      return passes
    })

    console.log('=== FILTERING END ===')
    console.log('Final filtered devices:', filtered.length)
    console.log('Filtered devices:', filtered.map(d => `${d.device} (${d.timestamp})`))
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
