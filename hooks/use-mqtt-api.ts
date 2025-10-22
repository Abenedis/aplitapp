// Client hook for MQTT data via API
"use client"

import { useState, useEffect, useCallback } from 'react'
import type { Device, SensorReading } from '@/lib/types'

interface MQTTData {
  macAddress: string
  temp: number
  humid: number
  ac_current: number
  opt_sensor: number
  hull: number
  pir: number
  in2: number
  dist: number
  timestamp: string
}

export function useMQTTData() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Connect to MQTT broker via API
  useEffect(() => {
    const connectToMQTT = async () => {
      try {
        console.log('📡 Connecting to MQTT broker aplit.tech:1883 via API...')
        
        const response = await fetch('/api/mqtt', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log('✅ Connected to MQTT broker aplit.tech:1883:', result.message)
          setIsConnected(true)
          setLastUpdate(new Date())
          
          // Process the received data from multiple devices
          if (result.devices && Array.isArray(result.devices)) {
            const devicesData: Device[] = result.devices.map((deviceData: any) => {
              const readings: SensorReading[] = deviceData.readings.map((reading: any) => ({
                temp: reading.temp,
                humid: reading.humid,
                ac_current: reading.ac_current,
                opt_sensor: reading.opt_sensor,
                hull: reading.hull,
                pir: reading.pir,
                in2: reading.in2,
                dist: reading.dist,
                timestamp: reading.timestamp
              }))
              
              return {
                macAddress: deviceData.macAddress,
                readings: readings
              }
            })
            
            setDevices(devicesData)
            
            console.log(`📡 Received data from MQTT broker aplit.tech:1883: ${result.devices.length} devices`)
            result.devices.forEach((device: any) => {
              const latestReading = device.readings[device.readings.length - 1]
              console.log(`  - Device: ${device.macAddress}, Readings: ${device.readings.length}, Latest Temp: ${latestReading?.temp.toFixed(1)}°C`)
            })
          }
        } else {
          console.error('❌ Failed to connect to MQTT broker aplit.tech:1883:', result.message)
          setIsConnected(false)
        }
      } catch (error) {
        console.error('❌ Error connecting to MQTT broker aplit.tech:1883:', error)
        setIsConnected(false)
      }
    }

    connectToMQTT()
    
    // Poll for new data every 10 seconds
    const interval = setInterval(connectToMQTT, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const reconnect = useCallback(async () => {
    console.log('🔄 Reconnecting to MQTT broker aplit.tech:1883...')
    
    try {
      const response = await fetch('/api/mqtt', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Reconnected to MQTT broker aplit.tech:1883')
        setIsConnected(true)
        setLastUpdate(new Date())
      } else {
        console.error('❌ Reconnection failed:', result.message)
        setIsConnected(false)
      }
    } catch (error) {
      console.error('❌ Reconnection error:', error)
      setIsConnected(false)
    }
  }, [])

  return {
    devices,
    isConnected,
    lastUpdate,
    reconnect
  }
}

// Hook for individual device data
export function useDeviceData(macAddress: string) {
  const [deviceData, setDeviceData] = useState<SensorReading[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const response = await fetch('/api/mqtt', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result = await response.json()
        
        if (result.success && result.data && result.data.macAddress === macAddress) {
          const reading: SensorReading = {
            temp: result.data.temp,
            humid: result.data.humid,
            ac_current: result.data.ac_current,
            opt_sensor: result.data.opt_sensor,
            hull: result.data.hull,
            pir: result.data.pir,
            in2: result.data.in2,
            dist: result.data.dist,
            timestamp: result.data.timestamp
          }
          
          setDeviceData([reading])
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Error fetching device data:', error)
        setIsConnected(false)
      }
    }

    fetchDeviceData()
    const interval = setInterval(fetchDeviceData, 10000)
    
    return () => clearInterval(interval)
  }, [macAddress])

  return {
    deviceData,
    isConnected
  }
}
