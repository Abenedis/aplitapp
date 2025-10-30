"use client"

import { useState, useMemo, useEffect } from "react"
import { DeviceCard } from "@/components/device-card"
import { DeviceFilters } from "@/components/device-filters"
import { UpdateNamesModal } from "@/components/update-names-modal"
import { DeviceManagement } from "@/components/device-management"
import { useMQTTData } from "@/hooks/use-mqtt-api"
import type { Device, DeviceName } from "@/lib/types"

export function DeviceGrid() {
  const DEFAULT_NAMES: Record<string, DeviceName> = {
    'F0:F5:BD:89:D1:B8': { homeName: 'Salon', roomName: '' },
    'F0:F5:BD:89:D1:A0': { homeName: 'Badroom', roomName: '' },
    'F0:F5:BD:89:D5:18': { homeName: 'Fridge', roomName: '' },
  }
  const [selectedDevice, setSelectedDevice] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [timeFrom, setTimeFrom] = useState<string>("")
  const [timeTo, setTimeTo] = useState<string>("")
  const [isUpdateNamesModalOpen, setIsUpdateNamesModalOpen] = useState(false)
  const [deviceNames, setDeviceNames] = useState<Record<string, DeviceName>>({})
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, 'active' | 'hidden' | 'deleted'>>({})

  // Get MQTT data
  const { devices: mqttDevices, isConnected, lastUpdate, reconnect } = useMQTTData()

  // Use only real MQTT data
  const devices = useMemo(() => {
    return mqttDevices
  }, [mqttDevices])

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
      const initial = savedNames ? JSON.parse(savedNames) : {}
      const merged: Record<string, DeviceName> = { ...initial }
      // Apply defaults when name is missing или пустой
      Object.entries(DEFAULT_NAMES).forEach(([mac, def]) => {
        const current = merged[mac]
        if (!current || !current.homeName || current.homeName.trim() === '') {
          merged[mac] = def
        }
      })
      setDeviceNames(merged)
      localStorage.setItem('deviceNames', JSON.stringify(merged))
      
      const savedStatuses = localStorage.getItem('deviceStatuses')
      if (savedStatuses) {
        setDeviceStatuses(JSON.parse(savedStatuses))
      }
    }
  }, [])

  // Ensure defaults are applied when new devices appear
  useEffect(() => {
    if (devices.length === 0) return
    const updated: Record<string, DeviceName> = { ...deviceNames }
    let changed = false
    devices.forEach(d => {
      if (!updated[d.macAddress] && DEFAULT_NAMES[d.macAddress]) {
        updated[d.macAddress] = DEFAULT_NAMES[d.macAddress]
        changed = true
      }
    })
    if (changed) {
      setDeviceNames(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('deviceNames', JSON.stringify(updated))
      }
    }
  }, [devices])

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

        {/* Active devices display */}
        <div className="flex flex-col gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard 
              key={device.macAddress} 
              device={device}
              deviceName={deviceNames[device.macAddress]}
              onHide={(macAddress) => handleDeviceAction(macAddress, 'hide')}
              onDelete={(macAddress) => handleDeviceAction(macAddress, 'delete')}
              showActions={true}
            />
          ))}
        </div>

        {/* Device Management */}
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
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                {isConnected ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              {isConnected ? (
                <>
                  <p className="text-gray-900 font-semibold">Подключено к MQTT брокеру</p>
                  <p className="text-gray-500 text-sm">Ожидание данных от устройств...</p>
                  <p className="text-gray-400 text-xs mt-2">Устройства появятся здесь, как только начнут отправлять данные на топики: shibaSensors/#, sensors/#, device/#</p>
                </>
              ) : (
                <>
                  <p className="text-gray-900 font-semibold">Не подключено к MQTT брокеру</p>
                  <p className="text-gray-500 text-sm">Проверьте подключение к aplit.tech:1883</p>
                </>
              )}
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
