"use client"

import { useState, useEffect, useCallback } from 'react'
import { realMQTTClient } from '@/lib/real-mqtt'
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

  // Real MQTT connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(realMQTTClient.getConnectionStatus())
    }

    checkConnection()
    const interval = setInterval(checkConnection, 1000)

    return () => clearInterval(interval)
  }, [])

  // Subscribe to MQTT topics for real data
  useEffect(() => {
    const handleSensorData = (data: any) => {
      try {
        let sensorData: MQTTData

        if (typeof data === 'string') {
          sensorData = JSON.parse(data)
        } else {
          sensorData = data
        }

        // Validate required fields
        if (!sensorData.macAddress || typeof sensorData.temp !== 'number') {
          console.warn('Invalid sensor data received from aplit.tech:', sensorData)
          return
        }

        // Create sensor reading
        const reading: SensorReading = {
          temp: sensorData.temp,
          humid: sensorData.humid || 0,
          ac_current: sensorData.ac_current || 0,
          opt_sensor: sensorData.opt_sensor || 0,
          hull: sensorData.hull || 0,
          pir: sensorData.pir || 0,
          in2: sensorData.in2 || 0,
          dist: sensorData.dist || 0,
          timestamp: sensorData.timestamp || new Date().toISOString()
        }

        // Update devices state
        setDevices(prevDevices => {
          const existingDeviceIndex = prevDevices.findIndex(
            device => device.macAddress === sensorData.macAddress
          )

          if (existingDeviceIndex >= 0) {
            // Update existing device
            const updatedDevices = [...prevDevices]
            updatedDevices[existingDeviceIndex] = {
              ...updatedDevices[existingDeviceIndex],
              readings: [...updatedDevices[existingDeviceIndex].readings, reading]
            }
            return updatedDevices
          } else {
            // Add new device
            return [...prevDevices, {
              macAddress: sensorData.macAddress,
              readings: [reading]
            }]
          }
        })

        setLastUpdate(new Date())
        console.log('📡 Updated device data from aplit.tech MQTT:', sensorData.macAddress)
      } catch (error) {
        console.error('Error processing sensor data from aplit.tech:', error)
      }
    }

    // Subscribe to sensor topics on aplit.tech:1883
    const topics = [
      'shibaSensors/#',
      'sensors/#',
      'device/#',
      'aplit/#'
    ]

    topics.forEach(topic => {
      realMQTTClient.subscribe(topic, handleSensorData)
    })

    return () => {
      topics.forEach(topic => {
        realMQTTClient.unsubscribe(topic)
      })
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realMQTTClient.disconnect()
    }
  }, [])

  const reconnect = useCallback(() => {
    console.log('🔄 MQTT reconnect to aplit.tech:1883 requested')
    realMQTTClient.reconnect()
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
    // For now, return empty data
    setDeviceData([])
    setIsConnected(false)
  }, [macAddress])

  return {
    deviceData,
    isConnected
  }
}
