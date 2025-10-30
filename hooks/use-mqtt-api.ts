// Client hook for MQTT data via API or WebSocket (for Vercel)
"use client"

import { useState, useEffect, useCallback } from 'react'
import type { Device, SensorReading } from '@/lib/types'
import mqtt, { MqttClient } from 'mqtt'

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
  const [client, setClient] = useState<MqttClient | null>(null)

  // Preferred: connect directly via MQTT over WebSocket in the browser when configured
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_MQTT_WS_URL
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD

    // If WS URL provided, connect from the browser (works on Vercel)
    if (typeof window !== 'undefined' && wsUrl) {
      try {
        const mqttClient = mqtt.connect(wsUrl, {
          username,
          password,
          protocolVersion: 4,
          clean: true,
          keepalive: 60,
          reconnectPeriod: 5000, // auto reconnect every 5s
          resubscribe: true,
        })

        setClient(mqttClient)

        mqttClient.on('connect', () => {
          setIsConnected(true)
          setLastUpdate(new Date())
          // Subscribe to topics used by Shiba devices
          ;['shibaSensors', 'shibaSensors/#', 'sensors/#', 'device/#'].forEach((topic) => {
            mqttClient.subscribe(topic, { qos: 0 })
          })
        })

        // Robust auto-reconnect with exponential backoff capping at 60s
        let backoffMs = 5000
        const scheduleReconnect = () => {
          if (mqttClient.connected) return
          setTimeout(() => {
            try { mqttClient.reconnect() } catch { /* noop */ }
            backoffMs = Math.min(backoffMs * 2, 60000)
          }, backoffMs)
        }

        mqttClient.on('message', (topic, payload) => {
          try {
            const text = payload.toString()
            let data: any = {}
            try {
              data = JSON.parse(text)
            } catch {
              data = { raw: text }
            }

            // Determine device id (MAC) from payload or topic
            let mac = data.device || data.macAddress || data.mac_address
            if (!mac && topic.includes('/')) {
              const parts = topic.split('/')
              const last = parts[parts.length - 1]
              if (last && (/(^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:)/.test(last) || /(^[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}-)/.test(last))) {
                mac = last
              }
            }
            if (mac) {
              mac = String(mac).toUpperCase().replace(/-/g, ':').trim()
            } else {
              mac = topic.replace(/\//g, '_')
            }

            const reading: SensorReading = {
              temp: data.temp ?? data.temperature ?? 0,
              humid: data.humid ?? data.humidity ?? 0,
              ac_current: data.ac_current ?? 0,
              opt_sensor: data.opt_sensor ?? 0,
              hull: data.hull ?? 0,
              pir: data.pir ?? 0,
              in2: data.in2 ?? 0,
              dist: data.dist ?? data.distance ?? 0,
              timestamp: data.timestamp || new Date().toISOString(),
            }

            setDevices((prev) => {
              const map = new Map(prev.map((d) => [d.macAddress, d]))
              const existing = map.get(mac)
              const readings = existing ? [...existing.readings, reading] : [reading]
              const trimmed = readings.length > 10 ? readings.slice(-10) : readings
              map.set(mac, { macAddress: mac, readings: trimmed })
              return Array.from(map.values())
            })
            setLastUpdate(new Date())
          } catch {
            // ignore malformed message
          }
        })

        mqttClient.on('error', () => { setIsConnected(false); scheduleReconnect() })
        mqttClient.on('offline', () => { setIsConnected(false); scheduleReconnect() })
        mqttClient.on('close', () => { setIsConnected(false); scheduleReconnect() })

        return () => {
          mqttClient.end(true)
        }
      } catch {
        // fall back to API polling below
      }
    }

    return () => {}
  }, [])

  // Fallback: poll server API (works locally or when a persistent server is available)
  useEffect(() => {
    // If we already have a WS client, skip polling
    if (client) return

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
  }, [client])

  const reconnect = useCallback(async () => {
    // Prefer reconnecting WS client if present
    if (client) {
      try {
        client.reconnect()
      } catch {}
      return
    }

    try {
      const response = await fetch('/api/mqtt', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await response.json()
      if (result.success) {
        setIsConnected(true)
        setLastUpdate(new Date())
      } else {
        setIsConnected(false)
      }
    } catch {
      setIsConnected(false)
    }
  }, [client])

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
