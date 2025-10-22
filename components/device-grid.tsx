"use client"

import { useState, useMemo, useEffect } from "react"
import { DeviceCard } from "@/components/device-card"
import { DeviceFilters } from "@/components/device-filters"
import { UpdateNamesModal } from "@/components/update-names-modal"
import { DeviceManagement } from "@/components/device-management"
import { useMQTTData } from "@/hooks/use-mqtt-api"
import { devices as mockDevices } from "@/lib/mock-data"
import type { Device, DeviceName } from "@/lib/types"

export function DeviceGrid() {
  const [selectedDevice, setSelectedDevice] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [timeFrom, setTimeFrom] = useState<string>("")
  const [timeTo, setTimeTo] = useState<string>("")
  const [isUpdateNamesModalOpen, setIsUpdateNamesModalOpen] = useState(false)
  const [deviceNames, setDeviceNames] = useState<Record<string, DeviceName>>({})
  const [useMockData, setUseMockData] = useState(true)
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, 'active' | 'hidden' | 'deleted'>>({})

  // Get MQTT data
  const { devices: mqttDevices, isConnected, lastUpdate, reconnect } = useMQTTData()

  // Use MQTT data if connected, otherwise fall back to mock data
  const devices = useMemo(() => {
    if (isConnected && mqttDevices.length > 0) {
      setUseMockData(false)
      return mqttDevices
    } else {
      setUseMockData(true)
      return mockDevices
    }
  }, [isConnected, mqttDevices])

  const resetFilters = () => {
    setSelectedDevice("all")
    setDateFrom("")
    setDateTo("")
    setTimeFrom("")
    setTimeTo("")
  }

  const handleUpdateNames = () => {
    setIsUpdateNamesModalOpen(true)
  }

  const handleSaveNames = (newDeviceNames: Record<string, DeviceName>) => {
    setDeviceNames(prev => ({
      ...prev,
      ...newDeviceNames
    }))
    // Save to localStorage for persistence (only on client side)
    if (typeof window !== 'undefined') {
      const updatedNames = { ...deviceNames, ...newDeviceNames }
      localStorage.setItem('deviceNames', JSON.stringify(updatedNames))
    }
  }

  const handleDeviceAction = (macAddress: string, action: 'hide' | 'show' | 'delete' | 'restore') => {
    setDeviceStatuses(prev => {
      const newStatuses = { ...prev }
      
      switch (action) {
        case 'hide':
          newStatuses[macAddress] = 'hidden'
          break
        case 'show':
          newStatuses[macAddress] = 'active'
          break
        case 'delete':
          newStatuses[macAddress] = 'deleted'
          break
        case 'restore':
          newStatuses[macAddress] = 'active'
          break
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('deviceStatuses', JSON.stringify(newStatuses))
      }
      
      return newStatuses
    })
  }

  // Load device names and statuses from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNames = localStorage.getItem('deviceNames')
      if (savedNames) {
        setDeviceNames(JSON.parse(savedNames))
      }
      
      const savedStatuses = localStorage.getItem('deviceStatuses')
      if (savedStatuses) {
        setDeviceStatuses(JSON.parse(savedStatuses))
      }
    }
  }, [])

  const filteredDevices = useMemo(() => {
    // Add status to devices and filter by status
    let filtered: Device[] = devices.map(device => ({
      ...device,
      status: deviceStatuses[device.macAddress] || 'active'
    })).filter(device => device.status === 'active')

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
      }, [selectedDevice, dateFrom, dateTo, timeFrom, timeTo, devices, deviceStatuses])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      <div className="space-y-8 p-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected to MQTT' : 'Disconnected - Using mock data'}
            </span>
            {lastUpdate && (
              <span className="text-xs text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          {!isConnected && (
            <button
              onClick={reconnect}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Reconnect
            </button>
          )}
        </div>

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
              onUpdateNames={handleUpdateNames}
              devices={devices.map(device => ({
                device: device.macAddress,
                ...device.readings[device.readings.length - 1] || {}
              }))}
              deviceNames={deviceNames}
            />

        <DeviceManagement
          devices={devices.map(device => ({
            ...device,
            status: deviceStatuses[device.macAddress] || 'active'
          }))}
          deviceNames={deviceNames}
          onDeviceAction={handleDeviceAction}
        />

        {filteredDevices.length === 0 && (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 shadow-lg backdrop-blur-sm">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0112 4c-2.34 0-4.29 1.009-5.824 2.709" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No devices or readings found matching the filters</p>
            </div>
          </div>
        )}

        <UpdateNamesModal
          isOpen={isUpdateNamesModalOpen}
          onClose={() => setIsUpdateNamesModalOpen(false)}
          devices={devices}
          deviceNames={deviceNames}
          onSaveNames={handleSaveNames}
        />
      </div>
    </div>
  )
}
